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
- **Smart Alerts**: Get notified when you're approaching or exceeding budget limits
- **Recurring Transactions**: Automatically add monthly recurring bills
- **Transaction Editing**: Edit any transaction with pre-populated form
- **Bulk Operations**: 
  - Select multiple transactions with checkboxes
  - Delete selected transactions
  - Delete all transactions with confirmation
- **Undo/Redo**: Mistake-proof with transaction history management
- **Search & Filter**: Quickly find transactions with debounced search
- **Sorting**: Sort by date or amount (ascending/descending)
- **Pagination**: Clean display with 10 transactions per page
- **Interactive Charts**: 
  - Pie chart with hover effects and distinct pastel colors
  - Line chart with clickable data points and tooltips
  - Dark theme support for charts
- **Data Export**: Download your data as JSON or CSV
- **Dark/Light Theme**: Toggle between themes with smooth transitions
- **Modern UI/UX**:
  - Glassmorphism effects
  - Gradient backgrounds with animated patterns
  - Glow effects on hover
  - Smooth animations and transitions
  - Finance-themed background patterns

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
# Using Python 3
python -m http.server 8000

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

### Bulk Delete Operations
1. Click "Select" button in Transaction History
2. Checkboxes appear next to each transaction
3. Select multiple transactions
4. Click "Delete Selected (X)" to remove selected items
5. Or click "Delete All" to remove all transactions
6. Confirmation dialog appears before deletion

### Setting Budgets
1. Click "Add Budget" button
2. Select category
3. Enter monthly limit
4. Save

### Viewing Insights
- Scroll to the "Spending Insights" section
- **Pie Chart**: 
  - View category breakdown with pastel colors
  - Hover over slices to see them pop out
  - Each slice shows category name, amount, and percentage
- **Line Chart**: 
  - Check 7-day spending trends
  - Hover over data points to see tooltips
  - Click on points to view detailed information

### Exporting Data
- Click "Export JSON" for complete data backup
- Click "Export CSV" for spreadsheet-compatible transaction list

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
- [ ] Add income transaction
- [ ] Add expense transaction
- [ ] Edit transaction
- [ ] Delete single transaction
- [ ] Bulk select and delete transactions
- [ ] Delete all transactions
- [ ] Undo/redo operations
- [ ] Set budget and verify alerts
- [ ] Search transactions
- [ ] Filter by type and category
- [ ] Sort transactions
- [ ] Navigate pagination
- [ ] Toggle dark/light theme
- [ ] Test chart interactions (hover, click)
- [ ] Export JSON and CSV
- [ ] Test on mobile device
- [ ] Test keyboard navigation
- [ ] Verify data persists after page reload
- [ ] Check responsive design on different screen sizes
- [ ] Test glassmorphism and glow effects

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📊 Performance Metrics

Run Lighthouse audit in Chrome DevTools:
- Performance: Target 90+
- Accessibility: Target 95+
- Best Practices: Target 90+
- SEO: Target 90+

## 🎨 Design Features

### Color Scheme
- **Light Theme**: Finance-themed with green (growth), blue (trust), gold (wealth)
- **Dark Theme**: Purple/indigo accents with smooth transitions
- **Balance Cards**: Individual gradient colors with matching glow effects
- **Charts**: Pastel colors for better visibility

### Visual Effects
- **Glassmorphism**: Frosted glass effect on cards and sections
- **Hover Animations**: Lift, scale, and glow effects
- **Gradient Backgrounds**: Animated multi-color gradients
- **Background Patterns**: Subtle finance-themed patterns
- **Smooth Transitions**: All interactions have smooth animations

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

- [ ] Service Worker for offline functionality
- [ ] Import data from JSON/CSV
- [ ] Multi-currency support
- [ ] Advanced analytics and reports
- [ ] Data backup to cloud
- [ ] Budget recommendations using AI
- [ ] Bill reminders and notifications
- [ ] Category-wise spending goals
- [ ] Monthly/yearly financial reports
- [ ] Data visualization improvements
- [ ] Mobile app version

## 📝 Code Quality

- Clean, readable code with comments
- Consistent naming conventions
- Modular architecture
- Error handling
- No external dependencies
- Follows ES6+ best practices

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
![Dashboard](screenshots/light-theme.png)

### Dark Theme
![Dashboard Dark](screenshots/dark-theme.png)

### Charts & Analytics
![Charts](screenshots/charts.png)

---

**Happy Tracking! 💸**

*Empowering Financial Freedom, One Transaction at a Time*
