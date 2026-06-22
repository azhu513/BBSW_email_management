/*
 * BBSW Email Management
 * Copyright (C) 2026 <Anqi Zhu>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details: https://www.gnu.org/licenses/gpl-3.0.html
 */

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