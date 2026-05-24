const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
    },
    plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free',
    },
}, { timestamps: true });

// Auto-generate slug from name before saving
organizationSchema.pre('save', async function (next) {
    if (!this.slug) {
        const base = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        let slug = base;
        let counter = 1;
        while (await mongoose.model('Organization').findOne({ slug, _id: { $ne: this._id } })) {
            slug = `${base}-${counter++}`;
        }
        this.slug = slug;
    }
    next();
});

organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ slug: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
