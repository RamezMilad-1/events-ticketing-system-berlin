const Outlet = require('../Model/OutletSchema');

exports.listOutlets = async (req, res, next) => {
    try {
        const filter = req.user?.role === 'System Admin' ? {} : { active: true };
        const outlets = await Outlet.find(filter).sort({ city: 1, name: 1 }).lean();
        res.json({ success: true, data: outlets });
    } catch (err) {
        next(err);
    }
};

exports.getOutletById = async (req, res, next) => {
    try {
        const outlet = await Outlet.findById(req.params.id).lean();
        if (!outlet) return res.status(404).json({ success: false, message: 'Outlet not found' });
        if (!outlet.active && req.user?.role !== 'System Admin') {
            return res.status(404).json({ success: false, message: 'Outlet not found' });
        }
        res.json({ success: true, data: outlet });
    } catch (err) {
        next(err);
    }
};

exports.createOutlet = async (req, res, next) => {
    try {
        const outlet = await Outlet.create(req.body);
        res.status(201).json({ success: true, data: outlet });
    } catch (err) {
        next(err);
    }
};

exports.updateOutlet = async (req, res, next) => {
    try {
        const outlet = await Outlet.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!outlet) return res.status(404).json({ success: false, message: 'Outlet not found' });
        res.json({ success: true, data: outlet });
    } catch (err) {
        next(err);
    }
};

exports.deleteOutlet = async (req, res, next) => {
    try {
        const result = await Outlet.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: 'Outlet not found' });
        res.json({ success: true, message: 'Outlet removed' });
    } catch (err) {
        next(err);
    }
};
