const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/backup - Export all data as JSON (requires authentication)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const data = await db.exportData();
    if (!data) {
      return res.status(500).json({ error: 'Failed to export data' });
    }
    
    // Set headers for file download
    const filename = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.json(data);
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// GET /api/backup/preview - Preview backup data without download
router.get('/preview', authenticateToken, async (req, res) => {
  try {
    const data = await db.exportData();
    if (!data) {
      return res.status(500).json({ error: 'Failed to export data' });
    }
    
    res.json({
      exportDate: data.exportDate,
      summary: {
        totalCustomers: data.customers?.length || 0,
        totalReminders: data.reminders?.length || 0,
        totalUsers: data.users?.length || 0
      },
      data: data
    });
  } catch (error) {
    console.error('Backup preview error:', error);
    res.status(500).json({ error: 'Failed to preview backup' });
  }
});

module.exports = router;
