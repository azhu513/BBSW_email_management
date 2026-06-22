# Setup

Step-by-step instructions to install the tool in a new Google Sheet.

## 1. Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. The tool expects a sheet tab named **"Email List"** to read email addresses from.

## 2. Access Apps Script

1. In the Google Sheet, click **Extensions** in the top menu
2. Select **Apps Script**
   - A new tab will open with the Apps Script editor
   - You'll see a default `Code.gs` file

## 3. Create Project Files

1. **Delete the default `Code.gs`**: Click the trash icon next to it
2. **Create `Shared.gs`**:
   - Click the **+** button next to "Files"
   - Select **Create new file**
   - Name it `Shared.gs` and click **Create**
   - Copy the entire contents of `Shared.gs` from this repository and paste it
3. **Create `Admin.gs`**:
   - Click the **+** button again
   - Name it `Admin.gs` and click **Create**
   - Copy and paste the contents of `Admin.gs`
4. **Create `Bootstrap.gs`**:
   - Click the **+** button again
   - Name it `Bootstrap.gs` and click **Create**
   - Copy and paste the contents of `Bootstrap.gs`

## 4. Update Configuration

1. In the Apps Script editor, click the **Project Settings** icon (gear icon) on the left sidebar
2. Under **Show advanced settings**, enable **Show "appsscript.json" manifest file in editor**
3. Click on `appsscript.json` in the file list (it should now be visible)
4. Copy the contents from the `appsscript.json` file in this repository and paste it into your project file, replacing the existing content
5. Click **Save**

## 5. Authorize the Script

1. Click **Run** at the top of the editor
2. A pop-up will appear asking for permissions
3. Select your Google account
4. Click **Allow** to grant Gmail and Drive access
5. After authorization completes, close the Apps Script tab

## 6. Create the Email List Sheet

1. In your Google Sheet, click the **+** button at the bottom to add a new sheet
2. Name it **"Email List"** (this name is required by the tool)
3. Add these column headers in row 1:
   - A1: `Timestamp`
   - B1: `First Name`
   - C1: `Last Name`
   - D1: `Affiliation`
   - E1: `Role`
   - F1: `Email Address`
   - G1: `Subscribe or Unsubscribe`
   - H1: `Partition` (optional—created automatically by "Assign/Refresh Partitions")

## 7. Customize Sender Display Name

By default, emails are sent with the display name "BBSW". To change this to your name or organization:

1. In the Apps Script editor, open `Admin.gs`
2. Find the line `name: 'BBSW'` (inside the `GmailApp.sendEmail` call within `adminSendToSubscribed_`)
3. Replace `'BBSW'` with your preferred name (e.g., `'John Smith'` or `'BBSW Communications'`)
4. Click **Save**
5. Refresh your Google Sheet

The next time you send an email, it will appear from your custom display name. Recipients will see "from: [Your Name] <your-email@gmail.com>" instead of "from: BBSW <your-email@gmail.com>".

## 8. Refresh and Verify

1. **Refresh the page** (or go back to your Google Sheet tab)
2. You should now see the **Admin Tools** menu at the top
3. You're ready to use all admin functions!

---

**Next:** [Managing Subscribers](managing-subscribers.md) · [Sending Campaigns](sending-campaigns.md) ·
