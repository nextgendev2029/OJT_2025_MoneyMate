# 💰 Money Mate - Personal Finance Tracker

A modern, feature-rich personal finance tracker built with vanilla HTML, CSS, and JavaScript. Track your income, expenses, set budgets, and gain insights into your spending habits with a beautiful, responsive interface.

🌐 **Live Demo**: [https://nextgendev2029.github.io/OJT_2025_MoneyMate/](https://nextgendev2029.github.io/OJT_2025_MoneyMate/)

## ✨ Features

### Core Features
- **Transaction Management**: Add, view, and delete income/expense transactions
- **Real-time Balance**: Automatic calculation of total balance, income, and expenses
- **Local Storage**: All data persists in browser's localStorage
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

### Advanced Features
- **Budget Tracking**: Set monthly budgets for different categories with visual alerts
  - Edit existing budgets with inline modal
  - Delete budgets with confirmation
  - Visual progress bars with color-coded warnings
- **Smart Alerts**: Get notified when you're approaching or exceeding budget limits
- **Recurring Transactions**: Automatically add monthly recurring bills
- **Transaction Editing**: Edit any transaction with pre-populated form and cancel option
- **Enhanced Bulk Operations**: 
  - Select multiple transactions with checkboxes
  - **Select All Visible**: Select all currently filtered/searched transactions
  - **Selective Export**: Export only selected transactions (JSON/CSV)
  - Delete selected transactions with count display
  - Delete all transactions with confirmation
- **Undo/Redo**: Mistake-proof with transaction history management
- **Advanced Search & Filter**: 
  - Debounced search across descriptions and categories
  - Filter by transaction type (income/expense)
  - Filter by category with dynamic category list
  - Smart category filter updates based on existing transactions
- **Flexible Sorting**: Sort by date or amount (ascending/descending)
- **Pagination**: Clean display with 10 transactions per page
- **Interactive Charts**: 
  - Pie chart with precise hover detection and highlight effects
  - Line chart with accurate tooltip positioning and click interactions
  - **Automatic Theme Updates**: Charts re-render immediately when switching themes
  - Dark theme support with proper color schemes
- **Smart Data Export**: 
  - Export all data as JSON or CSV
  - **Selective Export**: Export only selected transactions when in select mode
  - Dynamic filenames for selected exports (e.g., `selected-transactions-5.json`)
- **Responsive Dark/Light Theme**: 
  - Toggle between themes with smooth transitions
  - **Fixed Theme Switching**: Works consistently across all pages (home, about, contact)
  - **Improved Toast Notifications**: Proper visibility in both themes
  - **Enhanced Contact Page**: Team member cards with proper dark mode styling
- **Enhanced User Experience**:
  - **100-Increment Feature**: All amount inputs support 100-step increments via arrow keys or spinner clicks
  - **Fixed Header**: Header stays at top and doesn't scroll away
  - **Improved Modal Design**: Centered buttons with proper spacing
  - **Better Mobile Navigation**: Hamburger menu positioned below header, not overlapping
  - **Responsive Design Fixes**: Proper navigation menu behavior in both light and dark themes
- **Modern UI/UX**:
  - Glassmorphism effects with backdrop blur
  - Gradient backgrounds with animated patterns
  - Glow effects on hover with theme-appropriate colors
  - Smooth animations and transitions
  - Finance-themed background patterns
  - **Improved Accessibility**: Better contrast and visibility in all themes

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server or build tools required!

### Installation
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start tracking your finances!

```bash
# If you want to run a local server (optional)
# Using Python 3 (recommended for macOS users)
python3 -m http.server 8000

# Using Node.js
npx serve

# Then open http://localhost:8000
```

## 📖 How to Use

### Adding Transactions
1. Fill in the transaction form:
   - Select type (Income/Expense)
   - Enter amount in rupees
   - Choose category
   - Select date
   - Add description (optional)
   - Mark as recurring if it's a monthly transaction
2. Click "Add Transaction"

### Editing Transactions
1. Click the ✏️ (edit) icon next to any transaction
2. Form will populate with transaction data
3. Modify any field
4. Click "Update Transaction"
5. Click "Cancel" to exit edit mode

### Bulk Operations & Selective Export
1. **Enter Select Mode**: Click "Select" button in Transaction History
2. **Select Transactions**: 
   - Checkboxes appear next to each transaction
   - Select individual transactions by clicking checkboxes
   - Use "Select All" to select all currently visible/filtered transactions
3. **Bulk Actions**:
   - **Delete Selected**: Click "Delete Selected (X)" to remove selected items
   - **Export Selected**: Use "Export JSON" or "Export CSV" to export only selected transactions
   - **Delete All**: Click "Delete All" to remove all transactions
4. **Smart Features**:
   - Selected count displays in delete button
   - Confirmation dialogs appear before deletion
   - Export filenames include selection count (e.g., `selected-transactions-5.json`)
   - Select All respects current filters and search terms

### Budget Management
1. **Add Budget**: 
   - Click "Add Budget" button
   - Select category
   - Enter monthly limit (supports 100-increment feature)
   - Save
2. **Edit Budget**:
   - Click on any existing budget item
   - Modify the limit in the popup modal
   - Click "Update Budget" to save changes
3. **Delete Budget**:
   - Click on budget item to open options
   - Click "Delete Budget" and confirm
4. **Budget Alerts**:
   - Visual progress bars show spending vs. budget
   - Color-coded warnings (yellow at 80%, red when exceeded)
   - Alert messages appear when approaching or exceeding limits

### Viewing Insights
- Scroll to the "Spending Insights" section
- **Enhanced Pie Chart**: 
  - View category breakdown with distinct pastel colors
  - **Precise Hover Detection**: Accurate highlighting when hovering over slices
  - Each slice shows category name, amount, and percentage
  - Smooth pop-out animation effects
- **Improved Line Chart**: 
  - Check 7-day spending trends with accurate data points
  - **Fixed Tooltip Positioning**: Tooltips appear exactly at data points
  - **Smart Tooltip Placement**: Prevents tooltips from being cut off at chart edges
  - Hover for detailed information without clicking
  - **Theme-Responsive**: Charts automatically update colors when switching themes

### Smart Data Export
- **Full Export**:
  - Click "Export JSON" for complete data backup (transactions + budgets)
  - Click "Export CSV" for spreadsheet-compatible transaction list
- **Selective Export** (New Feature):
  - Enter select mode and choose specific transactions
  - Export buttons will export only selected transactions
  - Dynamic filenames show selection count (e.g., `selected-transactions-5.json`)
  - Perfect for exporting specific date ranges or categories

## 🏗️ Project Structure

```
money-mate/
├── index.html              # Main dashboard page
├── about.html              # About us page
├── contact.html            # Contact page
├── styles/
│   ├── main.css           # Main styles with glassmorphism
│   └── theme.css          # Dark/light theme styles
├── js/
│   ├── app.js             # Main application entry point
│   └── modules/
│       ├── storage.js     # localStorage management
│       ├── transactions.js # Transaction CRUD operations
│       ├── budgets.js     # Budget management
│       ├── charts.js      # Canvas chart rendering with interactions
│       ├── ui.js          # UI interactions and modals
│       ├── theme.js       # Theme management
│       └── export.js      # Data export (JSON/CSV)
├── demo-data.json          # Sample data for testing
└── README.md
```

## 🎯 Learning Goals Achieved

### Vanilla JS Architecture
- ✅ ES6 modules for code organization
- ✅ Class-based architecture
- ✅ Separation of concerns (MVC-like pattern)
- ✅ Event-driven programming

### Responsive Layouts
- ✅ CSS Grid for complex layouts
- ✅ Flexbox for component alignment
- ✅ Mobile-first responsive design
- ✅ Media queries for different screen sizes

### Accessibility
- ✅ ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Skip links and semantic HTML

### Client-side Storage
- ✅ localStorage for data persistence
- ✅ JSON serialization/deserialization
- ✅ Data caching strategy

### Performance
- ✅ Debounced search input
- ✅ Efficient DOM manipulation
- ✅ Pagination for large datasets
- ✅ Canvas API for performant charts

## 🧪 Testing

### Manual Testing Checklist
#### Core Functionality
- [ ] Add income transaction
- [ ] Add expense transaction
- [ ] Edit transaction (form pre-population and cancel)
- [ ] Delete single transaction
- [ ] Undo/redo operations
- [ ] Verify data persists after page reload

#### Budget Management
- [ ] Set budget and verify alerts
- [ ] Edit existing budget via click
- [ ] Delete budget with confirmation
- [ ] Test 100-increment feature on budget amounts

#### Advanced Features
- [ ] **Bulk Operations**: Select multiple transactions
- [ ] **Select All**: Select all visible/filtered transactions
- [ ] **Selective Export**: Export only selected transactions (JSON/CSV)
- [ ] Delete selected transactions
- [ ] Delete all transactions
- [ ] Search transactions (debounced)
- [ ] Filter by type and category
- [ ] Sort transactions (date/amount, asc/desc)
- [ ] Navigate pagination

#### Theme & UI
- [ ] **Theme Toggle**: Test on all pages (home, about, contact)
- [ ] **Toast Notifications**: Verify visibility in both themes
- [ ] **Contact Page**: Check team member cards in dark mode
- [ ] **Modal Design**: Verify centered buttons and proper spacing
- [ ] Test glassmorphism and glow effects

#### Charts & Interactions
- [ ] **Pie Chart**: Test precise hover detection and highlighting
- [ ] **Line Chart**: Verify accurate tooltip positioning
- [ ] **Theme Updates**: Charts re-render when switching themes
- [ ] Test chart interactions without infinite alerts

#### Responsive Design
- [ ] **Mobile Navigation**: Hamburger menu positioned below header
- [ ] **Fixed Header**: Header stays at top, doesn't scroll away
- [ ] **Navigation Menu**: Proper behavior in both light and dark themes
- [ ] Test on mobile device
- [ ] Check responsive design on different screen sizes
- [ ] Test keyboard navigation and accessibility

#### Input Features
- [ ] **100-Increment**: Test on all amount inputs (transaction, budget, edit budget)
- [ ] **Arrow Keys**: Up/down arrows increment by 100
- [ ] **Spinner Clicks**: Mouse clicks on input spinners increment by 100

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📊 Performance & Quality

### Performance Metrics
Run Lighthouse audit in Chrome DevTools:
- **Performance**: Target 90+ (optimized with debounced search, efficient DOM updates)
- **Accessibility**: Target 95+ (ARIA labels, keyboard navigation, screen reader support)
- **Best Practices**: Target 90+ (secure localStorage, proper error handling)
- **SEO**: Target 90+ (semantic HTML, meta tags, structured data)

### Code Quality Features
- **Modular Architecture**: ES6 modules with clear separation of concerns
- **Error Handling**: Graceful handling of edge cases and user errors
- **Performance Optimizations**:
  - Debounced search (300ms delay)
  - Efficient chart rendering with Canvas API
  - Smart DOM updates to minimize reflows
  - Pagination to handle large datasets
- **Accessibility Compliance**:
  - ARIA labels and roles throughout
  - Keyboard navigation support
  - High contrast ratios in both themes
  - Screen reader friendly content
- **Browser Compatibility**: Works across modern browsers with fallbacks

## 🎨 Design Features

### Color Scheme
- **Light Theme**: Finance-themed with green (growth), blue (trust), gold (wealth)
- **Dark Theme**: Purple/indigo accents with smooth transitions
- **Balance Cards**: Individual gradient colors with matching glow effects
- **Charts**: Pastel colors for better visibility

### Visual Effects & Recent Improvements
- **Glassmorphism**: Frosted glass effect on cards and sections with backdrop blur
- **Enhanced Hover Animations**: Lift, scale, and glow effects with theme-appropriate colors
- **Gradient Backgrounds**: Animated multi-color gradients with smooth transitions
- **Background Patterns**: Subtle finance-themed patterns with proper opacity
- **Smooth Transitions**: All interactions have 0.3s ease transitions
- **Fixed UI Elements**:
  - **Header**: Now properly fixed at top, doesn't scroll away
  - **Navigation**: Responsive hamburger menu positioned below header
  - **Modals**: Centered buttons with proper spacing and padding
  - **Toast Notifications**: Improved visibility in both light and dark themes
- **Theme Consistency**: All pages (home, about, contact) support theme switching
- **Mobile Optimizations**: Better responsive behavior across all screen sizes

### Customization

#### Changing Colors
Edit CSS variables in `styles/main.css`:
```css
:root {
    --primary: #0891b2;
    --success: #10b981;
    --danger: #ef4444;
    /* ... */
}
```

#### Changing Chart Colors
Edit colors array in `js/modules/charts.js`:
```javascript
this.colors = [
    '#FFB6C1', // Pastel Pink
    '#89CFF0', // Baby Blue
    // ... add more colors
];
```

#### Adding Categories
Edit the category options in `js/app.js` in the `updateCategoryOptions()` method

## 🔮 Future Enhancements

### Planned Features
- [ ] **Import Functionality**: Import data from JSON/CSV files
- [ ] **Advanced Analytics**: Monthly/yearly financial reports with trends
- [ ] **Multi-currency Support**: Handle different currencies with conversion
- [ ] **Cloud Backup**: Sync data across devices
- [ ] **Smart Notifications**: Bill reminders and budget alerts
- [ ] **AI-Powered Insights**: Budget recommendations and spending analysis

### Technical Improvements
- [ ] **Service Worker**: Offline functionality and caching
- [ ] **Progressive Web App**: Install as mobile app
- [ ] **Advanced Charts**: More visualization types (bar charts, donut charts)
- [ ] **Bulk Import**: CSV import for migrating from other apps
- [ ] **Category Management**: Custom categories and subcategories
- [ ] **Advanced Filtering**: Date ranges, amount ranges, multiple categories

### User Experience
- [ ] **Keyboard Shortcuts**: Quick actions via keyboard
- [ ] **Drag & Drop**: Reorder transactions or bulk operations
- [ ] **Advanced Search**: Search by amount ranges, date ranges
- [ ] **Transaction Templates**: Save frequently used transaction patterns
- [ ] **Goal Tracking**: Savings goals and progress tracking
- [ ] **Receipt Attachments**: Photo attachments for transactions

## 🔧 Recent Bug Fixes & Improvements

### Major Fixes Implemented
- **✅ Dark Mode Visibility**: Fixed team member cards and toast notifications in dark mode
- **✅ Theme Switching**: Consistent theme toggle functionality across all pages
- **✅ Navigation Responsiveness**: Fixed hamburger menu behavior in light theme
- **✅ Chart Interactions**: Improved hover detection and tooltip positioning
- **✅ Header Positioning**: Changed from sticky to fixed positioning
- **✅ Modal UX**: Centered buttons with proper spacing
- **✅ Chart Theme Updates**: Charts now re-render immediately when switching themes
- **✅ Input Enhancements**: 100-increment feature on all amount inputs including dynamic ones

### Performance Optimizations
- **Overflow Fix**: Added `overflow-x: hidden` to prevent horizontal scroll issues
- **Efficient Rendering**: Optimized chart updates and DOM manipulations
- **Smart Filtering**: Dynamic category filters based on existing transactions
- **Debounced Search**: Reduced unnecessary API calls and renders

## 📝 Code Quality

- **Clean Architecture**: Modular ES6 class-based structure
- **Comprehensive Comments**: Beginner-friendly code documentation
- **Consistent Naming**: Clear, descriptive variable and function names
- **Error Handling**: Graceful handling of edge cases and user errors
- **No External Dependencies**: Pure vanilla JavaScript implementation
- **Modern Standards**: Follows ES6+ best practices and conventions
- **Accessibility First**: WCAG compliant with proper ARIA labels
- **Cross-browser Compatibility**: Works on all modern browsers

## 🤝 Contributing

This is a learning project, but suggestions are welcome!

## 📄 License

Free to use for learning purposes.

## 👨‍💻 Authors

**Tuhin Mondal**
- Roll No: PST-25-0308
- Email: tuhinrock121@gmail.com

**Shelly Chahar**
- Roll No: PST-25-0246
- Email: shellychahar57@gmail.com

**Institution**: Polaris School of Technology  
**Program**: B.Tech CSE - 1st Year (2025 Sem1C)  
**Project Type**: OJT Product Development

---

## 🙏 Acknowledgments

- Built as part of On-the-Job Training (OJT) project
- Special thanks to our mentors and instructors
- Inspired by modern finance management applications

---

## 📸 Screenshots

### Light Theme
<img width="1050" height="699" alt="Screenshot 2025-12-11 at 12 40 49 PM" src="https://github.com/user-attachments/assets/d962acd4-653d-4b64-a07f-721fe5a9992f" />


### Dark Theme
<img width="1059" height="695" alt="Screenshot 2025-12-11 at 12 40 20 PM" src="https://github.com/user-attachments/assets/aef11138-5efb-4e34-9579-8e65a046cd26" />


### Charts & Analytics
<img width="1002" height="458" alt="Screenshot 2025-12-11 at 12 41 16 PM" src="https://github.com/user-attachments/assets/6fe8bf4b-c34b-46e8-ad7f-6010695a498f" />


---

**Happy Tracking! 💸**

*Empowering Financial Freedom, One Transaction at a Time*
