// Financial Health Score Module
export class FinancialHealthScore {
    constructor() {
        this.score = 0;
        this.breakdown = {
            savingsRate: 0,
            budgetAdherence: 0,
            emergencyFund: 0,
            spendingConsistency: 0,
            debtRatio: 0
        };
    }

    /**
     * Calculate overall financial health score (0-100)
     * @param {Object} data - Financial data
     * @returns {Object} - Score and breakdown
     */
    calculateScore(data) {
        const {
            totalIncome,
            totalExpenses,
            budgets,
            spendingByCategory,
            transactions,
            savingsBalance = 0
        } = data;

        // 1. Savings Rate (30 points)
        const savingsRate = this.calculateSavingsRate(totalIncome, totalExpenses);

        // 2. Budget Adherence (25 points)
        const budgetAdherence = this.calculateBudgetAdherence(budgets, spendingByCategory);

        // 3. Emergency Fund (20 points)
        const emergencyFund = this.calculateEmergencyFund(savingsBalance, totalExpenses);

        // 4. Spending Consistency (15 points)
        const spendingConsistency = this.calculateSpendingConsistency(transactions);

        // 5. Debt Ratio (10 points) - placeholder for now
        const debtRatio = 10; // Full points if no debt tracking

        this.breakdown = {
            savingsRate,
            budgetAdherence,
            emergencyFund,
            spendingConsistency,
            debtRatio
        };

        this.score = Math.round(
            savingsRate + budgetAdherence + emergencyFund + spendingConsistency + debtRatio
        );

        return {
            score: this.score,
            breakdown: this.breakdown,
            grade: this.getGrade(this.score),
            message: this.getMessage(this.score)
        };
    }

    calculateSavingsRate(income, expenses) {
        if (income <= 0) return 0;

        const savingsAmount = income - expenses;
        const savingsRate = (savingsAmount / income) * 100;

        // Score calculation (0-30 points)
        if (savingsRate >= 30) return 30; // Excellent: 30%+ savings
        if (savingsRate >= 20) return 25; // Great: 20-30% savings
        if (savingsRate >= 10) return 20; // Good: 10-20% savings
        if (savingsRate >= 5) return 15;  // Fair: 5-10% savings
        if (savingsRate > 0) return 10;   // Poor: 0-5% savings
        return 0; // No savings or negative
    }

    calculateBudgetAdherence(budgets, spending) {
        if (!budgets || Object.keys(budgets).length === 0) return 0;

        let totalCategories = 0;
        let categoriesWithinBudget = 0;
        let totalOverspend = 0;
        let totalBudget = 0;

        Object.keys(budgets).forEach(category => {
            const budgetAmount = budgets[category] || 0;
            const spentAmount = spending[category] || 0;

            totalCategories++;
            totalBudget += budgetAmount;

            if (spentAmount <= budgetAmount) {
                categoriesWithinBudget++;
            } else {
                totalOverspend += (spentAmount - budgetAmount);
            }
        });

        if (totalCategories === 0) return 0;

        // Calculate adherence percentage
        const adherenceRate = (categoriesWithinBudget / totalCategories) * 100;
        const overspendRate = totalBudget > 0 ? (totalOverspend / totalBudget) * 100 : 0;

        // Score calculation (0-25 points)
        if (adherenceRate === 100) return 25; // Perfect adherence
        if (adherenceRate >= 80) return 20;   // Very good
        if (adherenceRate >= 60) return 15;   // Good
        if (adherenceRate >= 40) return 10;   // Fair
        if (adherenceRate >= 20) return 5;    // Poor
        return 0; // Very poor
    }

    calculateEmergencyFund(savings, monthlyExpenses) {
        if (monthlyExpenses <= 0) return 20; // No expenses = full points

        const monthsCovered = savings / monthlyExpenses;

        // Score calculation (0-20 points)
        if (monthsCovered >= 6) return 20;  // Excellent: 6+ months
        if (monthsCovered >= 3) return 15;  // Good: 3-6 months
        if (monthsCovered >= 1) return 10;  // Fair: 1-3 months
        if (monthsCovered >= 0.5) return 5; // Poor: 2 weeks
        return 0; // Very poor: less than 2 weeks
    }

    calculateSpendingConsistency(transactions) {
        if (!transactions || transactions.length < 7) return 15; // Not enough data

        // Get last 30 days of expenses
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentExpenses = transactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo)
            .map(t => t.amount);

        if (recentExpenses.length < 5) return 15; // Not enough data

        // Calculate standard deviation
        const mean = recentExpenses.reduce((sum, val) => sum + val, 0) / recentExpenses.length;
        const variance = recentExpenses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentExpenses.length;
        const stdDev = Math.sqrt(variance);

        // Calculate coefficient of variation (CV)
        const cv = mean > 0 ? (stdDev / mean) * 100 : 100;

        // Score calculation (0-15 points)
        // Lower CV = more consistent spending = higher score
        if (cv <= 20) return 15;  // Very consistent
        if (cv <= 40) return 12;  // Consistent
        if (cv <= 60) return 9;   // Moderate
        if (cv <= 80) return 6;   // Inconsistent
        if (cv <= 100) return 3;  // Very inconsistent
        return 0; // Extremely inconsistent
    }

    getGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B+';
        if (score >= 60) return 'B';
        if (score >= 50) return 'C+';
        if (score >= 40) return 'C';
        if (score >= 30) return 'D';
        return 'F';
    }

    getMessage(score) {
        if (score >= 90) return 'Excellent! Your financial health is outstanding! 🎉';
        if (score >= 80) return 'Great job! You\'re managing your finances very well! 💪';
        if (score >= 70) return 'Good work! Keep up the positive habits! 👍';
        if (score >= 60) return 'You\'re on the right track. A few improvements will help! 📈';
        if (score >= 50) return 'Fair. Focus on building better financial habits. 💡';
        if (score >= 40) return 'Needs improvement. Let\'s work on your finances! 📊';
        return 'Time to take control of your finances! Start small. 🚀';
    }

    getScoreColor(score) {
        if (score >= 80) return '#10b981'; // Green
        if (score >= 60) return '#f59e0b'; // Orange
        return '#ef4444'; // Red
    }

    getBreakdownDetails() {
        return [
            {
                name: 'Savings Rate',
                score: this.breakdown.savingsRate,
                maxScore: 30,
                icon: '💰',
                tip: 'Aim to save at least 20% of your income'
            },
            {
                name: 'Budget Adherence',
                score: this.breakdown.budgetAdherence,
                maxScore: 25,
                icon: '🎯',
                tip: 'Stay within your set budgets for each category'
            },
            {
                name: 'Emergency Fund',
                score: this.breakdown.emergencyFund,
                maxScore: 20,
                icon: '🛡️',
                tip: 'Build an emergency fund covering 3-6 months of expenses'
            },
            {
                name: 'Spending Consistency',
                score: this.breakdown.spendingConsistency,
                maxScore: 15,
                icon: '📊',
                tip: 'Maintain consistent spending patterns to avoid surprises'
            },
            {
                name: 'Debt Management',
                score: this.breakdown.debtRatio,
                maxScore: 10,
                icon: '💳',
                tip: 'Keep debt payments below 30% of income'
            }
        ];
    }
}
