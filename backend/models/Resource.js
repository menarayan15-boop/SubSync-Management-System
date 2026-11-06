import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Reports & Analytics',
        'Developer SDKs & Code',
        'Design Assets & UI Kits',
        'E-Books & Whitepapers',
        'Security Audit Tools',
        'Templates & Checklists',
      ],
      default: 'Reports & Analytics',
    },
    planLevelRequired: {
      type: String,
      enum: ['Free', 'Bronze', 'Silver', 'Gold'],
      default: 'Free',
    },
    tierLevelRequired: {
      type: Number,
      default: 0, // 0: Free, 1: Bronze, 2: Silver, 3: Gold
      index: true,
    },
    fileType: {
      type: String,
      default: 'PDF',
    },
    fileSize: {
      type: String,
      default: '2.4 MB',
    },
    pageCount: {
      type: Number,
      default: 8,
    },
    filePath: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileContent: {
      type: String,
      default: 'SubSync Digital Resource Vault publication.',
    },
    tableOfContents: [
      {
        chapterNumber: { type: Number },
        title: { type: String },
        page: { type: Number },
      },
    ],
    highlights: [
      {
        type: String,
      },
    ],
    author: {
      type: String,
      default: 'SubSync Research & Engineering Labs',
    },
    version: {
      type: String,
      default: 'v2026.1',
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Resource', ResourceSchema);
