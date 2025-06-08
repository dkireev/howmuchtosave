// Financial Savings Calculator JavaScript
class SavingsCalculator {
    constructor() {
        this.initializeElements();
        this.setDefaultValues();
        this.attachEventListeners();
        this.calculate();
    }

    initializeElements() {
        this.goalAmountInput = document.getElementById('goalAmount');
        this.timeHorizonInput = document.getElementById('timeHorizon');
        this.annualReturnInput = document.getElementById('annualReturn');
        this.currentSavingsInput = document.getElementById('currentSavings');
        this.clearBtn = document.getElementById('clearBtn');
        
        this.monthlyPaymentDisplay = document.getElementById('monthlyPayment');
        this.totalSavedDisplay = document.getElementById('totalSaved');
        this.interestEarnedDisplay = document.getElementById('interestEarned');
        this.finalAmountDisplay = document.getElementById('finalAmount');
        this.progressFill = document.getElementById('progressFill');
        
        this.exampleButtons = document.querySelectorAll('.example-btn');
    }

    setDefaultValues() {
        this.goalAmountInput.value = '50000';
        this.timeHorizonInput.value = '5';
        this.annualReturnInput.value = '7';
        this.currentSavingsInput.value = '0';
    }

    attachEventListeners() {
        // Real-time calculation on input change
        const inputs = [this.goalAmountInput, this.timeHorizonInput, this.annualReturnInput, this.currentSavingsInput];
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.sanitizeInput(e.target);
                this.handleInputChange();
            });
            input.addEventListener('blur', (e) => this.validateInput(e.target));
            
            // Handle focus - select all text for easy replacement
            input.addEventListener('focus', (e) => {
                setTimeout(() => {
                    e.target.select();
                }, 10);
            });

            // Prevent non-numeric input on keypress
            input.addEventListener('keypress', (e) => {
                const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'Backspace', 'Delete', 'Tab', 'Enter'];
                const key = e.key;
                
                if (!allowedKeys.includes(key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                }
                
                // Only allow one decimal point
                if (key === '.' && e.target.value.includes('.')) {
                    e.preventDefault();
                }
            });
        });

        // Clear button
        this.clearBtn.addEventListener('click', () => this.clearAll());

        // Example buttons
        this.exampleButtons.forEach(btn => {
            btn.addEventListener('click', () => this.loadExample(btn));
        });
    }

    sanitizeInput(input) {
        let value = input.value;
        
        // Remove any non-numeric characters except decimal point
        const originalValue = value;
        value = value.replace(/[^0-9.]/g, '');
        
        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // Limit decimal places for percentage input
        if (input === this.annualReturnInput && parts.length === 2) {
            value = parts[0] + '.' + parts[1].substring(0, 2);
        }
        
        // Update input only if value actually changed
        if (originalValue !== value) {
            const cursorPosition = input.selectionStart;
            input.value = value;
            // Restore cursor position
            const newPosition = Math.min(cursorPosition, value.length);
            input.setSelectionRange(newPosition, newPosition);
        }
    }

    handleInputChange() {
        // Debounce the calculation to prevent excessive updates
        clearTimeout(this.calculationTimeout);
        this.calculationTimeout = setTimeout(() => {
            this.calculate();
        }, 150);
    }

    validateInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.getAttribute('min')) || 0;
        const max = parseFloat(input.getAttribute('max')) || Infinity;

        // Handle empty inputs
        if (input.value === '' || input.value === null) {
            if (input === this.currentSavingsInput) {
                input.value = '0';
            } else {
                input.classList.add('error');
                this.showErrorMessage(input, 'Please enter a value');
                return false;
            }
        } else if (isNaN(value)) {
            input.classList.add('error');
            this.showErrorMessage(input, 'Please enter a valid number');
            return false;
        } else if (value < min) {
            input.classList.add('error');
            this.showErrorMessage(input, `Value must be at least ${min}`);
            return false;
        } else if (value > max) {
            input.classList.add('error');
            this.showErrorMessage(input, `Value must be no more than ${max}`);
            return false;
        } else {
            input.classList.remove('error');
            this.hideErrorMessage(input);
            return true;
        }
        return true;
    }

    showErrorMessage(input, message) {
        let errorDiv = input.parentNode.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            input.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }

    hideErrorMessage(input) {
        const errorDiv = input.parentNode.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
    }

    getInputValues() {
        return {
            goalAmount: Math.max(0, parseFloat(this.goalAmountInput.value) || 0),
            timeHorizon: Math.max(0, parseFloat(this.timeHorizonInput.value) || 0),
            annualReturn: Math.max(0, parseFloat(this.annualReturnInput.value) || 0),
            currentSavings: Math.max(0, parseFloat(this.currentSavingsInput.value) || 0)
        };
    }

    calculate() {
        const { goalAmount, timeHorizon, annualReturn, currentSavings } = this.getInputValues();

        // Validate basic requirements
        if (goalAmount <= 0 || timeHorizon <= 0) {
            this.displayResults({
                monthlyPayment: 0,
                totalSaved: currentSavings,
                interestEarned: 0,
                finalAmount: goalAmount,
                progressPercentage: 0
            });
            return;
        }

        // Ensure current savings doesn't exceed goal
        const effectiveCurrentSavings = Math.min(currentSavings, goalAmount);
        
        const monthlyRate = annualReturn / 100 / 12;
        const totalMonths = timeHorizon * 12;

        let monthlyPayment = 0;
        let futureValueOfCurrentSavings = 0;

        // Calculate future value of current savings
        if (effectiveCurrentSavings > 0) {
            if (annualReturn > 0) {
                futureValueOfCurrentSavings = effectiveCurrentSavings * Math.pow(1 + monthlyRate, totalMonths);
            } else {
                futureValueOfCurrentSavings = effectiveCurrentSavings;
            }
        }

        // Calculate required future value from monthly payments
        const requiredFromPayments = Math.max(0, goalAmount - futureValueOfCurrentSavings);

        if (requiredFromPayments > 0) {
            if (annualReturn > 0 && monthlyRate > 0) {
                // Future Value of Annuity formula: FV = PMT * (((1 + r)^n - 1) / r)
                // Therefore: PMT = FV / (((1 + r)^n - 1) / r)
                const futureValueFactor = (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;
                monthlyPayment = requiredFromPayments / futureValueFactor;
            } else {
                // No interest case
                monthlyPayment = requiredFromPayments / totalMonths;
            }
        }

        // Ensure monthly payment is valid
        if (!isFinite(monthlyPayment) || isNaN(monthlyPayment) || monthlyPayment < 0) {
            monthlyPayment = 0;
        }

        // Calculate totals
        const totalMonthlySavings = monthlyPayment * totalMonths;
        const totalPrincipal = effectiveCurrentSavings + totalMonthlySavings;
        
        // Calculate interest earned
        let totalInterestEarned = 0;
        if (annualReturn > 0) {
            const futureValueOfPayments = monthlyPayment > 0 ? monthlyPayment * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) : 0;
            const totalFutureValue = futureValueOfCurrentSavings + futureValueOfPayments;
            totalInterestEarned = Math.max(0, totalFutureValue - totalPrincipal);
        }

        const finalAmount = totalPrincipal + totalInterestEarned;
        const progressPercentage = goalAmount > 0 ? Math.min(100, (finalAmount / goalAmount) * 100) : 0;

        this.displayResults({
            monthlyPayment: monthlyPayment,
            totalSaved: totalPrincipal,
            interestEarned: totalInterestEarned,
            finalAmount: goalAmount,
            progressPercentage: progressPercentage
        });
    }

    displayResults(results) {
        // Add animation classes
        this.monthlyPaymentDisplay.classList.add('updating');
        this.totalSavedDisplay.classList.add('updating');
        this.interestEarnedDisplay.classList.add('updating');

        // Update values with animation
        setTimeout(() => {
            this.monthlyPaymentDisplay.textContent = this.formatCurrency(results.monthlyPayment);
            this.totalSavedDisplay.textContent = this.formatCurrency(results.totalSaved);
            this.interestEarnedDisplay.textContent = this.formatCurrency(results.interestEarned);
            this.finalAmountDisplay.textContent = this.formatCurrency(results.finalAmount);

            // Update progress bar
            // this.progressFill.style.width = `${Math.min(100, Math.max(0, results.progressPercentage))}%`;
            this.progressFill.style.width = `${results.totalSaved * 100 / results.finalAmount}%`;

            // Remove animation classes
            setTimeout(() => {
                this.monthlyPaymentDisplay.classList.remove('updating');
                this.totalSavedDisplay.classList.remove('updating');
                this.interestEarnedDisplay.classList.remove('updating');
            }, 250);
        }, 50);
    }

    formatCurrency(amount) {
        if (isNaN(amount) || !isFinite(amount)) return '$0';
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.round(Math.abs(amount)));
    }

    loadExample(button) {
        const goal = button.dataset.goal;
        const time = button.dataset.time;
        const returnRate = button.dataset.return;

        // Add visual feedback
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);

        // Clear any error states first
        this.clearErrorStates();

        // Set values directly
        this.goalAmountInput.value = goal;
        this.timeHorizonInput.value = time;
        this.annualReturnInput.value = returnRate;
        this.currentSavingsInput.value = '0';

        // Trigger calculation
        this.calculate();

        // Scroll to results on mobile
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                document.querySelector('.calculator__results').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 300);
        }
    }

    clearErrorStates() {
        const inputs = [this.goalAmountInput, this.timeHorizonInput, this.annualReturnInput, this.currentSavingsInput];
        inputs.forEach(input => {
            input.classList.remove('error');
            this.hideErrorMessage(input);
        });
    }

    clearAll() {
        // Add loading state
        document.querySelector('.results-card').classList.add('calculating');

        setTimeout(() => {
            this.setDefaultValues();
            this.clearErrorStates();
            this.calculate();
            
            document.querySelector('.results-card').classList.remove('calculating');
        }, 300);
    }
}

// Initialize the calculator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SavingsCalculator();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to clear
    if (e.key === 'Escape') {
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) clearBtn.click();
    }
    
    // Enter key to focus next input
    if (e.key === 'Enter' && e.target.classList.contains('form-control')) {
        e.preventDefault();
        const inputs = Array.from(document.querySelectorAll('.form-control'));
        const currentIndex = inputs.indexOf(e.target);
        const nextInput = inputs[currentIndex + 1];
        if (nextInput) {
            nextInput.focus();
        } else {
            e.target.blur(); // Remove focus from last input
        }
    }
});
