# Move Subscription Visualizations Below Yearly Subscriptions

## Current Structure
The subscriptions page currently has this order:
1. Header & Stats Cards
2. **Data Visualizations** (Trends, Distribution, Revenue charts)
3. Filters
4. Monthly Subscriptions Table
5. Yearly Subscriptions Table
6. Edit/Delete Dialogs

## Desired Structure
Move the visualizations to appear after the Yearly Subscriptions table:
1. Header & Stats Cards
2. Filters
3. Monthly Subscriptions Table
4. Yearly Subscriptions Table
5. **Data Visualizations** (Trends, Distribution, Revenue charts)
6. Edit/Delete Dialogs

## Manual Steps to Reorganize

### Step 1: Locate the Sections
In `components/pages/SubscriptionManagement.tsx`:
- **Data Visualizations section**: Lines ~438-547
- **Yearly Subscriptions Table**: Lines ~650-720

### Step 2: Cut the Visualizations Section
Find and cut these lines (approximately 438-547):
```tsx
{/* Data Visualizations */}
<div className="grid gap-6 lg:grid-cols-2">
  {/* Subscription Trends Chart */}
  <Card className="shadow-card">
    ...
  </Card>

  {/* Subscription Distribution Pie Chart */}
  <Card className="shadow-card">
    ...
  </Card>
</div>

{/* Monthly Revenue Summary */}
<Card className="shadow-card">
  ...
</Card>
```

### Step 3: Paste After Yearly Subscriptions
Paste the cut section right after the Yearly Subscriptions Card closes (around line 720), before the Edit Subscription Dialog.

## Alternative: Use Git/IDE Tools

### Using VS Code
1. Open `components/pages/SubscriptionManagement.tsx`
2. Find the comment `{/* Data Visualizations */}` (line ~438)
3. Select from that line down to just before `{/* Filters */}` (line ~548)
4. Cut (Ctrl+X / Cmd+X)
5. Find `{/* Edit Subscription Dialog */}` (line ~721)
6. Position cursor on the line before it
7. Paste (Ctrl+V / Cmd+V)
8. Save the file

### Verification
After moving, the page should display:
1. Stats cards at top
2. Filters
3. Monthly subscriptions table
4. Yearly subscriptions table
5. Charts and graphs (Trends, Distribution, Revenue)
6. Edit/Delete dialogs

## Benefits
- Better logical flow: data tables first, then analytics
- Users see actual subscriptions before visualizations
- Graphs provide summary after viewing details
- More intuitive navigation

## Note
The visualizations section includes:
- Subscription Trends Line Chart
- Subscription Distribution Pie Chart  
- Monthly Revenue Summary Bar Chart

All three charts will move together as one section.
