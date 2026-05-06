/***** BOOTSTRAP: onOpen builds admin menu *****/
function onOpen(e) {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Admin Tools')
      .addItem('Clean + Deduplicate (Global)',           'adminCleanAndDedup')
      .addItem('Assign/Refresh Partitions',              'adminAssignPartitions')
      .addItem('Set Partition Count…',                   'adminSetPartitionCount')
      .addSeparator()
      .addItem('Send now (Sidebar)',                     'adminOpenSendSidebar')
      .addItem('Send now (use saved inputs)',            'adminSendUsingSavedInputs')
      .addItem('Schedule Re-Send in 1 Week',            'adminScheduleResend')
      .addSeparator()
      .addItem('Import Legacy CSV (from Drive)',         'adminImportLegacyCsv')
      .addItem('Import Unsubscribe List',                'adminImportUnsubscribes')
      .addItem('Reset Legacy Backdate Sequence',         'resetLegacyBackdateSequence_')
      .addSeparator()
      .addItem('Audit Bounces (Global)',                 'adminAuditBounces')
      .addItem('Remove All Re-Send Triggers',           'adminRemoveResendTriggers')
      .addToUi();
  } catch (err) {
    Logger.log('onOpen: ' + err.message);
  }
}