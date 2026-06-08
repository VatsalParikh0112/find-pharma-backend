const MedicineRequest = require('../models/MedicineRequest');
const Pharmacy = require('../models/Pharmacy');

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// Resolve the Pharmacy listing owned by the logged-in pharmacy account.
const getOwnedPharmacy = async req => Pharmacy.findOne({ owner: req.user._id });

// Lazily auto-cancel stale requests for this pharmacy:
//  - pending (under review) for more than 7 days → rejected (auto)
// Runs on read so the data is always fresh without a cron job.
const autoCancelStale = async pharmacyId => {
  const cutoff = new Date(Date.now() - SEVEN_DAYS);
  await MedicineRequest.updateMany(
    { pharmacy: pharmacyId, status: 'pending', createdAt: { $lt: cutoff } },
    {
      $set: {
        status: 'rejected',
        autoCancelled: true,
        rejectionReason: 'Automatically cancelled — not reviewed within 7 days.',
      },
    },
  );
};

const populateRequest = q =>
  q
    .populate('patient', 'name email phone')
    .populate('insurance', 'providerName policyNumber planName holderName');

// GET /api/pharmacy/requests/stats
const getStats = async (req, res) => {
  try {
    const pharmacy = await getOwnedPharmacy(req);
    if (!pharmacy) return res.json({ success: true, stats: empty() });

    await autoCancelStale(pharmacy._id);

    const [total, pending, accepted, fulfilled, rejected] = await Promise.all([
      MedicineRequest.countDocuments({ pharmacy: pharmacy._id }),
      MedicineRequest.countDocuments({ pharmacy: pharmacy._id, status: 'pending' }),
      MedicineRequest.countDocuments({ pharmacy: pharmacy._id, status: 'accepted' }),
      MedicineRequest.countDocuments({ pharmacy: pharmacy._id, status: 'fulfilled' }),
      MedicineRequest.countDocuments({ pharmacy: pharmacy._id, status: 'rejected' }),
    ]);

    // Last 7 days trend (requests created per day).
    const since = new Date(Date.now() - SEVEN_DAYS);
    const trendRaw = await MedicineRequest.aggregate([
      { $match: { pharmacy: pharmacy._id, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]);
    const trendMap = Object.fromEntries(trendRaw.map(t => [t._id, t.count]));
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      trend.push({ date: key, count: trendMap[key] || 0 });
    }

    const collectionRate = total ? Math.round((fulfilled / total) * 100) : 0;

    res.json({
      success: true,
      stats: {
        total,
        current: pending, // under review
        pending: accepted, // approved, awaiting collection
        completed: fulfilled,
        rejected,
        collectionRate,
        trend,
      },
    });
  } catch (err) {
    console.error('Pharmacy stats error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const empty = () => ({
  total: 0,
  current: 0,
  pending: 0,
  completed: 0,
  rejected: 0,
  collectionRate: 0,
  trend: [],
});

// GET /api/pharmacy/requests?status=&search=&sort=
// status: all | current(pending) | pending(accepted) | completed(fulfilled) | rejected
const getRequests = async (req, res) => {
  try {
    const pharmacy = await getOwnedPharmacy(req);
    if (!pharmacy) return res.json({ success: true, requests: [] });

    await autoCancelStale(pharmacy._id);

    const { status = 'all', search = '', sort = 'newest' } = req.query;

    const statusMap = {
      current: 'pending',
      pending: 'accepted',
      completed: 'fulfilled',
      rejected: 'rejected',
    };

    const filter = { pharmacy: pharmacy._id };
    if (statusMap[status]) filter.status = statusMap[status];

    let requests = await populateRequest(MedicineRequest.find(filter)).sort(
      sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 },
    );

    // Text search across patient name, medicine, request id (applied in-memory
    // because patient name lives on the populated doc).
    const q = String(search).trim().toLowerCase();
    if (q) {
      requests = requests.filter(
        r =>
          r.medicineName?.toLowerCase().includes(q) ||
          r.patient?.name?.toLowerCase().includes(q) ||
          r._id.toString().toLowerCase().includes(q),
      );
    }

    if (sort === 'priority') {
      requests = [...requests].sort((a, b) =>
        a.priority === b.priority ? 0 : a.priority === 'urgent' ? -1 : 1,
      );
    }

    res.json({ success: true, requests });
  } catch (err) {
    console.error('Pharmacy requests error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper to find one request that belongs to this pharmacy.
const findOwned = async (req, id) => {
  const pharmacy = await getOwnedPharmacy(req);
  if (!pharmacy) return null;
  return MedicineRequest.findOne({ _id: id, pharmacy: pharmacy._id });
};

// PUT /api/pharmacy/requests/:id/approve   body: { notes? }
const approve = async (req, res) => {
  try {
    const request = await findOwned(req, req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be approved' });
    }
    request.status = 'accepted';
    request.acceptedAt = new Date();
    if (req.body.notes) request.pharmacyNotes = req.body.notes;
    await request.save();
    res.json({ success: true, message: 'Request approved', request });
  } catch (err) {
    console.error('Approve error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/pharmacy/requests/:id/reject   body: { reason? }
const reject = async (req, res) => {
  try {
    const request = await findOwned(req, req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (!['pending', 'accepted'].includes(request.status)) {
      return res.status(400).json({ success: false, message: 'This request cannot be rejected' });
    }
    request.status = 'rejected';
    request.autoCancelled = false;
    request.rejectionReason = req.body.reason || 'Rejected by pharmacy';
    await request.save();
    res.json({ success: true, message: 'Request rejected', request });
  } catch (err) {
    console.error('Reject error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/pharmacy/requests/:id/collect  → mark fulfilled
const markCollected = async (req, res) => {
  try {
    const request = await findOwned(req, req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Only approved requests can be collected' });
    }
    request.status = 'fulfilled';
    request.collectedAt = new Date();
    await request.save();
    res.json({ success: true, message: 'Marked as collected', request });
  } catch (err) {
    console.error('Collect error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/pharmacy/requests/:id/cancel  → cancel an approved-but-uncollected
// request (allowed only after 7 days uncollected). Lands in Rejected (auto).
const cancelUncollected = async (req, res) => {
  try {
    const request = await findOwned(req, req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Only approved requests can be cancelled' });
    }
    const acceptedAt = request.acceptedAt || request.updatedAt;
    if (Date.now() - new Date(acceptedAt).getTime() < SEVEN_DAYS) {
      return res
        .status(400)
        .json({ success: false, message: 'Can only cancel after 7 days uncollected' });
    }
    request.status = 'rejected';
    request.autoCancelled = true;
    request.rejectionReason = 'Cancelled — not collected within 7 days.';
    await request.save();
    res.json({ success: true, message: 'Request cancelled', request });
  } catch (err) {
    console.error('Cancel error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/pharmacy/requests/:id/notes   body: { notes }
const updateNotes = async (req, res) => {
  try {
    const request = await findOwned(req, req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    request.pharmacyNotes = req.body.notes || '';
    await request.save();
    res.json({ success: true, message: 'Notes saved', request });
  } catch (err) {
    console.error('Notes error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getStats,
  getRequests,
  approve,
  reject,
  markCollected,
  cancelUncollected,
  updateNotes,
};
