// Function to calculate sources and uses of funds
function calculateSourcesAndUses(updatedDictionary) {
    // Assuming the following keys from the formDictionary
    const purchasePrice = formDictionary['purchase-price'] || 0;
    const closingCosts = formDictionary['closing-costs'] || 0;
    const imClosingFee = formDictionary['im-closing-fee'] || 0;
	const helClosingFee = formDictionary['hel-closing-fee'] || 0;
    const helAmount = formDictionary['hel-amount'] || 0;
    const downPaymentPercent = formDictionary['down-payment-percent'] || 0;
    const helActive = formDictionary['use-hel']; // Check if HEL is active
	
    
    // Calculating the down payment amount
    const downPayment = purchasePrice * downPaymentPercent;
    
    // Calculating the initial mortgage amount
    const initialMortgage = purchasePrice - downPayment;
	
	// Calculating the initial financing loan fees
	const closingLoanCosts = initialMortgage*imClosingFee + helActive*helAmount*helClosingFee;
    
    // Calculating total uses of funds
    const totalUses = purchasePrice + closingCosts + closingLoanCosts;
    
    // Calculating total available financing
    const totalFinancing = helActive ? (helAmount + initialMortgage) : initialMortgage;
    
    // Calculating required equity
    const equityNeeded = totalUses - totalFinancing;
	
	// Calculating total sources of funds
	const totalSources = helActive*helAmount + initialMortgage + equityNeeded;
    
    // Return the calculated sources and uses
    return {
        equity: equityNeeded,
        hel: helActive ? helAmount : 0,
        initialMortgage: initialMortgage,
        totalSources: totalSources,
        purchasePrice: purchasePrice,
		closingCosts: closingCosts,
		closingLoanCosts: closingLoanCosts,
        totalUses: totalUses
    };
}

//XIRR function
function XIRR(values, months, guess) {
    // Initial validation
    if (values.length !== months.length) {
        throw new Error('Values and months arrays must have the same length.');
    }

    // Define the function to calculate net present value (NPV) for a given rate
    function NPV(rate) {
        let npv = 0;
        for (let i = 0; i < values.length; i++) {
            npv += values[i] / Math.pow(1 + rate, months[i] / 12);
        }
        return npv;
    }

    // Initialize variables for iteration
    let lower = -1.0;  // Lower bound for rate
    let upper = 1.0;   // Upper bound for rate
    let guessRate = guess || 0.1;  // Initial guess for rate
    const tolerance = 0.0000001;  // Tolerance level for NPV
    let npvGuess = NPV(guessRate);  // NPV at guess rate

    // Iterative approach to find the rate
    for (let i = 0; i < 100; i++) { // Maximum 100 iterations
        if (Math.abs(npvGuess) < tolerance) {
            return guessRate;
        }

        let derivative = (NPV(guessRate * 1.000001) - npvGuess) / (guessRate * 0.000001);
        guessRate -= npvGuess / derivative;

        npvGuess = NPV(guessRate);

        if (npvGuess > 0) {
            lower = guessRate;
        } else {
            upper = guessRate;
        }
		
        if (Math.abs(upper - lower) < tolerance) {
            return guessRate;
        }
    }

    throw new Error('XIRR calculation did not converge.');
}


// Helper function to calculate PMT (periodic payment)
function PMT(rate, nper, pv, fv = 0, type = 0) {
  if (rate === 0) return -(pv + fv) / nper;

  const pvif = Math.pow(1 + rate, nper);
  let pmt = (rate / (pvif - 1)) * -(pv * pvif + fv);

  if (type === 1) pmt /= 1 + rate;

  return pmt;
}

// Helper function to calculate FV (future value)
function FV(rate, nper, pmt, pv, type = 0) {
  if (nper === 0) return -pv;

  const pvif = Math.pow(1 + rate, nper);
  let fv = -pv * pvif - pmt * (pvif - 1) / rate;

  if (type === 1) fv /= 1 + rate;

  return fv;
}

// Helper function to calculate IPMT (interest portion of payment)
function IPMT(rate, per, nper, pv, fv = 0, type = 0) {
  if (per < 1 || per >= nper + 1) return null;

  const pmt = PMT(rate, nper, pv, fv, type);
  const balance = FV(rate, per - 1, pmt, pv, type);

  return balance * rate;
}


// PPMT function
function PPMT(rate, per, nper, pv, fv = 0, type = 0) {
  if (per < 1 || per >= nper + 1) return null;

  const pmt = PMT(rate, nper, pv, fv, type);
  const ipmt = IPMT(rate, per, nper, pv, fv, type);

  return pmt - ipmt;
}



	
	


// Here's the fixed version of the calculate_debt_service function
// This addresses the timing issues with IM and RM interest around refinance

function calculate_debt_service(schedule, updatedDictionary) {
    //establish sources and uses
    const sandU = calculateSourcesAndUses(updatedDictionary);
    
    //initialize the refinanced value
    let refiValue = 0;
    
    //establish interest rates
    const imMonthlyInterest = updatedDictionary['im-rate']/12;
    const rmMonthlyInterest = updatedDictionary['rm-rate']/12;
    const helMonthlyInterest = updatedDictionary['hel-rate']/12;
    
    // Determine refinance month 
    const refinanceActive = updatedDictionary['refinance-mortgage'] ? true : false;
    const refinanceMonth = refinanceActive ? updatedDictionary['refinance-years']*12 : -1;
    
    let imIssuance = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let imExtraPaymentPeriod = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    if(updatedDictionary['im-extra-payments']) {
        const imMonthsBetweenPayments = Math.floor(12 / updatedDictionary['im-extra-payment-times']);
        imExtraPaymentPeriod = Array.from({ length: schedule['months'].length }, (_, index) => 
            index === 0 ? 0 : (index % imMonthsBetweenPayments === 0 ? 1 : 0));
    }
    let imExtraPayment = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let imRefinance = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let imScheduledRepayment = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let imBeginningBalanceArray = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let imEndBalanceArray = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let imInterestExpense = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let imBeginningBalance = 0;
    let imEndBalance = 0;
    
    let helIssuance = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let helExtraPaymentPeriod = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    if(updatedDictionary['hel-extra-payments']) {
        const helMonthsBetweenPayments = Math.floor(12 / updatedDictionary['hel-extra-payment-times']);
        helExtraPaymentPeriod = Array.from({ length: schedule['months'].length }, (_, index) => 
            index === 0 ? 0 : (index % helMonthsBetweenPayments === 0 ? 1 : 0));
        }
    let helExtraPayment = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let helScheduledRepayment = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let helBeginningBalanceArray = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let helEndBalanceArray = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let helInterestExpense = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let helBeginningBalance = 0;
    let helEndBalance = 0;
    
    let rmIssuance = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let rmExtraPaymentPeriod = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    if(updatedDictionary['rm-extra-payments'] && updatedDictionary['refinance-mortgage']) {
        const rmMonthsBetweenPayments = Math.floor(12 / updatedDictionary['rm-extra-payment-times']);
        const refinanceMonth = Math.round(updatedDictionary['refinance-years'] * 12);

        rmExtraPaymentPeriod = Array.from({ length: schedule['months'].length }, (_, index) => {
            // Only allow extra payments after refinance date
            if(index <= refinanceMonth || index === 0) {
                return 0;
            }
            // Apply normal payment schedule after refinance date
            return (index % rmMonthsBetweenPayments === 0) ? 1 : 0;
        });
    }
    let rmExtraPayment = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let rmScheduledRepayment = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let rmBeginningBalanceArray = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let rmEndBalanceArray = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let rmInterestExpense = Array.from({ length: schedule['months'].length }, (_, index) => 0);
    let rmBeginningBalance = 0;
    let rmEndBalance = 0;
    
    
    for (let i = 0; i < schedule['months'].length; i++) {
        
        // Calculate beginning of period balance
        if (i === 0) {
            // First period
            imBeginningBalance = 0; // Initial balance of initial mortgage
            imIssuance[0] = sandU['initialMortgage'];
            helIssuance[0] = sandU['hel'];
            
            helBeginningBalance = 0; // Initial balance of home equity loan
            rmBeginningBalance = 0; // Initial balance of refinanced mortgage
        } else if (refinanceActive && i > refinanceMonth) {
            // After refinance, force IM beginning balance to zero
            imBeginningBalance = 0;
            
            // For HEL and RM, get previous end balance
            helBeginningBalance = helEndBalanceArray[i - 1]; 
            rmBeginningBalance = rmEndBalanceArray[i - 1];
        } else {
            // Normal case - use previous end balance for all loan types
            imBeginningBalance = imEndBalanceArray[i - 1];
            helBeginningBalance = helEndBalanceArray[i - 1];
            rmBeginningBalance = rmEndBalanceArray[i - 1];
        }
        
        // Calculate initial mortgage extra payments
        if (imExtraPaymentPeriod[i]) {
            imExtraPayment[i] = -updatedDictionary['im-extra-payment-amount']/updatedDictionary['im-extra-payment-times'];
        }

        // Calculate refinanced mortgage extra payments
        if (rmExtraPaymentPeriod[i]) {
            rmExtraPayment[i] = -updatedDictionary['rm-extra-payment-amount']/updatedDictionary['rm-extra-payment-times'];
        }
        
        // Calculate home equity loan extra payments
        if (helExtraPaymentPeriod[i]) {
            helExtraPayment[i] = -updatedDictionary['hel-extra-payment-amount']/updatedDictionary['hel-extra-payment-times'];
        }
        
        // IMPORTANT FIX: Calculate scheduled principal payments BEFORE refinance
        
        // Calculate initial mortgage scheduled payments
        if (schedule['imPaymentPeriod'][i] > 0) {
            // Note: We exclude imRefinance from this calculation to ensure principal payment happens
            imScheduledRepayment[i] = -Math.min(
                -PPMT(imMonthlyInterest, i, updatedDictionary['im-term']*12, sandU['initialMortgage'], 0),
                imBeginningBalance + imIssuance[i] + imExtraPayment[i]
            );
        }
        
        // Calculate home equity loan scheduled payments - only when payment period is active
        if (schedule['helPaymentPeriod'][i] > 0) {
            helScheduledRepayment[i] = -Math.min(
                -PPMT(helMonthlyInterest, i, updatedDictionary['hel-term']*12, sandU['hel'], 0),
                helBeginningBalance + helIssuance[i] + helExtraPayment[i]
            );
        }
        
        // Calculate refinanced mortgage scheduled payments - only when payment period is active
        if (schedule['rmPaymentPeriod'][i] > 0) {
            rmScheduledRepayment[i] = -Math.min(
                -PPMT(rmMonthlyInterest, schedule['rmPaymentPeriod'][i], updatedDictionary['rm-term']*12, refiValue, 0),
                rmBeginningBalance + rmIssuance[i] + rmExtraPayment[i]
            );
        }
        
        // NOW apply the refinance transaction AFTER scheduled payments are calculated
        if (refinanceActive) {
            if (i == refinanceMonth) {
                // Calculate the remaining balance after the scheduled payment
                const remainingBalance = imBeginningBalance + imIssuance[i] + imExtraPayment[i] + imScheduledRepayment[i];
                
                // Only refinance the initial mortgage, not the HEL
                refiValue = remainingBalance;

                // Pay off only the initial mortgage
                imRefinance[i] = -refiValue;

                // Issue new refinanced mortgage
                rmIssuance[i] = refiValue;
            }
        }
        
        // Calculate end of period balance
        let imNetCashFlow = imIssuance[i] + imExtraPayment[i] + imRefinance[i] + imScheduledRepayment[i];
        let helNetCashFlow = helIssuance[i] + helExtraPayment[i] + helScheduledRepayment[i];
        let rmNetCashFlow = rmIssuance[i] + rmExtraPayment[i] + rmScheduledRepayment[i];
        
        imEndBalance = imBeginningBalance + imNetCashFlow;
        helEndBalance = helBeginningBalance + helNetCashFlow;
        rmEndBalance = rmBeginningBalance + rmNetCashFlow;
        
        // Force zero end balance at and after refinance for IM
        if (refinanceActive && i >= refinanceMonth) {
            imEndBalance = 0;
        }
        
        // Store balances in arrays
        imBeginningBalanceArray[i] = imBeginningBalance;
        imEndBalanceArray[i] = imEndBalance;

        helBeginningBalanceArray[i] = helBeginningBalance;
        helEndBalanceArray[i] = helEndBalance;

        rmBeginningBalanceArray[i] = rmBeginningBalance;
        rmEndBalanceArray[i] = rmEndBalance;

        // Calculate interest expenses
        if (i === 0) {
            // First period handling
            imInterestExpense[i] = (imBeginningBalance + imIssuance[i]) * schedule['holdPeriod'][i] * imMonthlyInterest;
            helInterestExpense[i] = (helBeginningBalance + helIssuance[i]) * schedule['holdPeriod'][i] * helMonthlyInterest;
            rmInterestExpense[i] = (rmBeginningBalance + rmIssuance[i]) * schedule['holdPeriod'][i] * rmMonthlyInterest;
        } else {
            // IM interest - continues through refinance month, then stops
            if (refinanceActive && i > refinanceMonth) {
                // After refinance month - no IM interest
                imInterestExpense[i] = 0;
            } else {
                // Before and during refinance month - calculate IM interest normally
                imInterestExpense[i] = schedule['imPaymentPeriod'][i] > 0 ? 
                    imBeginningBalance * schedule['holdPeriod'][i] * imMonthlyInterest : 0;
            }
            
            // RM interest - only starts AFTER refinance month
            if (refinanceActive && i > refinanceMonth) {
                // After refinance month - calculate RM interest normally
                rmInterestExpense[i] = schedule['rmPaymentPeriod'][i] > 0 ? 
                    rmBeginningBalance * schedule['holdPeriod'][i] * rmMonthlyInterest : 0;
            } else {
                // Before and during refinance month - no RM interest
                rmInterestExpense[i] = 0;
            }
            
            // HEL interest - based on payment period
            helInterestExpense[i] = schedule['helPaymentPeriod'][i] > 0 ? 
                helBeginningBalance * schedule['holdPeriod'][i] * helMonthlyInterest : 0;
        }
    }
    
    return {'Initial Mortgage':
                        {'BOP':imBeginningBalanceArray,
                         'Issuance':imIssuance,
                         'Extra Payments':imExtraPayment,
                         'Refinance':imRefinance,
                         'Scheduled Payments': imScheduledRepayment,
                         'EOP':imEndBalanceArray,
                         'Interest Expense':imInterestExpense
                        },
            'Home Equity Loan':
                        {'BOP':helBeginningBalanceArray,
                         'Issuance':helIssuance,
                         'Extra Payments':helExtraPayment,
                         'Scheduled Payments': helScheduledRepayment,
                         'EOP':helEndBalanceArray,
                         'Interest Expense':helInterestExpense
                        },
            'Refinanced Mortgage':
                        {'BOP':rmBeginningBalanceArray,
                         'Issuance':rmIssuance,
                         'Extra Payments':rmExtraPayment,
                         'Scheduled Payments': rmScheduledRepayment,
                         'EOP':rmEndBalanceArray,
                         'Interest Expense':rmInterestExpense
                        }
                     }
}
// Function to properly set up payment periods for all loan types
function get_months_and_flags(updatedDictionary) {
    let months = updatedDictionary['investment-years'] * 12 + 1;
    let monthsArray = Array.from({ length: months }, (_, index) => index);
    let holdArray = monthsArray.map((value, index) => (index === 0 ? 0 : 1));
    let imPaymentPeriodArray = monthsArray.map((value, index) => (index === 0 ? 0 : 1));
    let helPaymentPeriodArray = monthsArray.map((value, index) => (index === 0 ? 0 : 1)); 
    let rmPaymentPeriodArray = monthsArray.map((value, index) => (index === 0 ? 0 : 1));
    let annualFlag = Array.from({ length: months }, (_, index) => index === 0 ? 0 : (index % 12 === 0 ? 1 : 0));
    
    // Get the HEL term in months
    const helActive = updatedDictionary['use-hel']; 
    const helTermMonths = helActive ? (updatedDictionary['hel-term'] * 12) : 0;
    
    // Setting up initial and refinance mortgage payment periods
    if (updatedDictionary['refinance-mortgage']) {
        const refinanceMonth = updatedDictionary['refinance-years'] * 12;
        
        // Initial mortgage payments only until refinance
        imPaymentPeriodArray = holdArray.map((value, index) => {
            if (index === 0) return 0;
            if (index <= refinanceMonth) return index;
            return 0; // Stop IM payments after refinance
        });
        
        // Refinanced mortgage payments only after refinance
        rmPaymentPeriodArray = holdArray.map((value, index) => {
            if (index <= refinanceMonth) return 0;
            return index - refinanceMonth; // Start RM payments immediately after refinance
        });
        
        // HEL payments only until HEL term, regardless of refinance
        helPaymentPeriodArray = holdArray.map((value, index) => {
            if (index === 0) return 0;
            if (helActive && index <= helTermMonths) return index;
            return 0; // Stop HEL payments after HEL term
        });
    } else {
        // No refinance - initial mortgage payments continue throughout
        imPaymentPeriodArray = holdArray.map((value, index) => {
            if (index === 0) return 0;
            return index;
        });
        
        // No refinance - no refinanced mortgage payments
        rmPaymentPeriodArray = Array.from({ length: months }, (_, index) => 0);
        
        // HEL payments only until HEL term
        helPaymentPeriodArray = holdArray.map((value, index) => {
            if (index === 0) return 0;
            if (helActive && index <= helTermMonths) return index;
            return 0; // Stop HEL payments after HEL term
        });
    }

    return {
        months: monthsArray,
        annualFlag: annualFlag,
        holdPeriod: holdArray,
        imPaymentPeriod: imPaymentPeriodArray,
        helPaymentPeriod: helPaymentPeriodArray,
        rmPaymentPeriod: rmPaymentPeriodArray
    };  
}



function calculate_cash_flows(schedule, updatedDictionary, debtServiceDF) {

	//establish sources and uses
	const sandU = calculateSourcesAndUses(updatedDictionary);
	
	//initialize arrays
	var toggleSwitch = document.getElementById('toggle-switch');
	let revenues = Array.from({ length: schedule['months'].length }, (_, index) => 0);
	let rawRevenues = Array.from({ length: schedule['months'].length }, (_, index) => 0);
	let insurance = Array.from({ length: schedule['months'].length }, (_, index) => 0);
	let hoa = Array.from({ length: schedule['months'].length }, (_, index) => 0);
	let propertyTax = Array.from({ length: schedule['months'].length }, (_, index) => 0);
	let maintenance = Array.from({ length: schedule['months'].length }, (_, index) => 0);
	let managementFee = Array.from({ length: schedule['months'].length }, (_, index) => 0);
	
	let cpiArray = schedule['months'].map((value, index) => (1 + updatedDictionary['cpi-assumption']/12)**Math.max(0, index - 1));


	let propertyPriceArray = schedule['months'].map((value, index) => updatedDictionary['purchase-price'] * (1 + updatedDictionary['home-growth-rate']/12)**Math.max(0, index - 1));
	let propertyAssessmentArray = propertyPriceArray
	// escalation factor for monthly rent
	let rentIncreaseArray = schedule['months'].map((value, index) => {
		return (1 + updatedDictionary['annual-rent-increase'])**Math.max(0, Math.floor((index - 1) / 12));
	});

	if (toggleSwitch.checked) {
		
		propertyAssessmentArray = schedule['months'].map((value, index) => updatedDictionary['purchase-price'] * (1 + updatedDictionary['property-tax-growth']/12)**Math.max(0, index - 1));
		
		revenues = schedule['holdPeriod'].map((value,index) => value * updatedDictionary['occupancy-rate']* updatedDictionary['monthly-rent'] * rentIncreaseArray[index]);
		
		// Calculate raw revenues (without occupancy adjustment)
		rawRevenues = schedule['holdPeriod'].map((value, index) => value * updatedDictionary['monthly-rent'] * rentIncreaseArray[index]);
		
		// Expense schedules
		insurance = schedule['holdPeriod'].map((value,index) => {
			if (index % 12 == 0) {
				return -value*updatedDictionary['annual-insurance']*(1+updatedDictionary['annual-insurance-growth']/12)**index;
			} else {
				return 0;
			}
		});
		hoa = schedule['holdPeriod'].map((value,index) => {
			if (index % 12 == 0) {
				return -value*updatedDictionary['annual-hoa']*(1+updatedDictionary['annual-hoa-growth']/12)**index;
			} else {
				return 0;
			}
		});
		propertyTax = schedule['holdPeriod'].map((value,index) => {
			if (index % 12 == 0) {
				return -value*propertyAssessmentArray[index]*updatedDictionary['annual-property-tax'];
			} else {
				return 0;
			}
		});
		maintenance = schedule['holdPeriod'].map((value,index) => {
			if (index % 12 == 0) {
				return -value*updatedDictionary['annual-maintenance']*(1+updatedDictionary['maintenance-growth']/12)**index;
			} else {
				return 0;
			}
		});
		managementFee = revenues.map((value,index) => -value*updatedDictionary['management-fee']);
		
		
	} else {
		revenues = schedule['holdPeriod'].map((value,index) => value * updatedDictionary['monthly-rent'] * rentIncreaseArray[index]);
		
		// In basic form, raw revenue equals revenue (no occupancy adjustment)
		rawRevenues = revenues.slice();
		
		

		// Expense schedules
		insurance = schedule['holdPeriod'].map((value,index) => {
			if (index % 12 == 0) {
				return -value*updatedDictionary['annual-insurance']*cpiArray[index];
			} else {
				return 0;
			}
		});
		hoa = schedule['holdPeriod'].map((value,index) => {
			if (index % 12 == 0) {
				return -value*updatedDictionary['annual-hoa']*cpiArray[index];
			} else {
				return 0;
			}
		});
		propertyTax = schedule['holdPeriod'].map((value,index) => {
			if (index % 12 == 0) {
				return -value*propertyPriceArray[index]*updatedDictionary['annual-property-tax'];
			} else {
				return 0;
			}
		});
		maintenance = schedule['holdPeriod'].map((value,index) => {
			if (index % 12 == 0) {
				return -value*updatedDictionary['annual-maintenance']*cpiArray[index];
			} else {
				return 0;
			}
		});
		managementFee = revenues.map((value,index) => -value*updatedDictionary['management-fee']);
	}
	
	let operatingCF = revenues.map((value,index) => value + insurance[index] + hoa[index] + propertyTax[index] + maintenance[index] + managementFee[index]);
	
	// Debt service components - Keeping your original formulas
	let imDebtService = debtServiceDF['Initial Mortgage']['Extra Payments'].map((value, index) => value + debtServiceDF['Initial Mortgage']['Scheduled Payments'][index] - debtServiceDF['Initial Mortgage']['Interest Expense'][index]);
	let helDebtService = debtServiceDF['Home Equity Loan']['Extra Payments'].map((value, index) => value + debtServiceDF['Home Equity Loan']['Scheduled Payments'][index] - debtServiceDF['Home Equity Loan']['Interest Expense'][index]);
	let rmDebtService = debtServiceDF['Refinanced Mortgage']['Extra Payments'].map((value, index) => value + debtServiceDF['Refinanced Mortgage']['Scheduled Payments'][index] - debtServiceDF['Refinanced Mortgage']['Interest Expense'][index]);
	
	// Extract components for model output
	let imPrincipal = debtServiceDF['Initial Mortgage']['Scheduled Payments'].map(value => -value);
	let helPrincipal = debtServiceDF['Home Equity Loan']['Scheduled Payments'].map(value => -value);
	let rmPrincipal = debtServiceDF['Refinanced Mortgage']['Scheduled Payments'].map(value => -value);
	
	let imInterest = debtServiceDF['Initial Mortgage']['Interest Expense'];
	let helInterest = debtServiceDF['Home Equity Loan']['Interest Expense'];
	let rmInterest = debtServiceDF['Refinanced Mortgage']['Interest Expense'];
	
	let imExtra = debtServiceDF['Initial Mortgage']['Extra Payments'].map(value => -value);
	let helExtra = debtServiceDF['Home Equity Loan']['Extra Payments'].map(value => -value);
	let rmExtra = debtServiceDF['Refinanced Mortgage']['Extra Payments'].map(value => -value);
	
	let totalDebtService = imDebtService.map((value,index) => value + rmDebtService[index] + helDebtService[index]);
	let leveredCF = operatingCF.map((value,index) => value + totalDebtService[index]);
	let positiveCF = leveredCF.map((value, index) => Math.max(0,value));
	let additionalEquity = leveredCF.map((value, index) => -Math.min(value,0));
	let additionalEquityTotal = additionalEquity.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
	let xirrCF = leveredCF.slice()
	
	let homeSalePrice = propertyPriceArray[schedule['months'].length-1];
	let imEOPBalance = debtServiceDF['Initial Mortgage']['EOP'][schedule['months'].length-1];
	let helEOPBalance = debtServiceDF['Home Equity Loan']['EOP'][schedule['months'].length-1];
	let rmEOPBalance = debtServiceDF['Refinanced Mortgage']['EOP'][schedule['months'].length-1];
	let homeSaleProceeds = homeSalePrice - imEOPBalance - helEOPBalance - rmEOPBalance;
	
	xirrCF[0] = -sandU['equity'];
	xirrCF[schedule['months'].length-1] += homeSaleProceeds;
	
	let totalEquity = additionalEquityTotal + sandU['equity'];

	
	let xirr = XIRR(xirrCF, schedule['months'], 0.2);
	let moic = (positiveCF.reduce((accumulator, currentValue) => accumulator + currentValue, 0) + homeSaleProceeds) / totalEquity
	
	// Calculate debt balances for logging
	let imBalances = debtServiceDF['Initial Mortgage']['EOP'].slice();
	let helBalances = debtServiceDF['Home Equity Loan']['EOP'].slice();
	let rmBalances = debtServiceDF['Refinanced Mortgage']['EOP'].slice();
	let totalDebt = imBalances.map((value, index) => value + helBalances[index] + rmBalances[index]);
	
	// Calculate equity contributions (money going in)
	let equityContributions = [sandU['equity']]; // Start with initial equity
	for (let i = 1; i < schedule['months'].length; i++) {
		// Add any additional equity needed for negative cash flows
		equityContributions.push(Math.max(0, -leveredCF[i]));
	}
	let totalEquityContributions = sandU['equity'] + additionalEquityTotal;

	// Calculate equity distributions (money coming out)
	let equityDistributions = [];
	for (let i = 0; i < schedule['months'].length - 1; i++) {
		// Only count positive cash flows as distributions
		equityDistributions.push(Math.max(0, leveredCF[i]));
	}
	// Add the home sale proceeds to the last month's distribution
	let finalMonthDistribution = Math.max(0, leveredCF[schedule['months'].length - 1]) + homeSaleProceeds;
	equityDistributions.push(finalMonthDistribution);
	let totalEquityDistributions = positiveCF.reduce((acc, val) => acc + val, 0) + homeSaleProceeds;

	// Calculate cumulative arrays for charting
	let cumulativeContributions = [];
	let cumulativeDistributions = [];
	let netEquity = [];
	let runningContribution = 0;
	let runningDistribution = 0;

	for (let i = 0; i < schedule['months'].length; i++) {
		runningContribution += equityContributions[i];
		runningDistribution += equityDistributions[i];
		cumulativeContributions.push(runningContribution);
		cumulativeDistributions.push(runningDistribution);
		netEquity.push(runningDistribution - runningContribution);
	}
	
	// Add all the debt service components to the model outputs
	const model_outputs = {
		'IRR': xirr,
		'MOIC': moic,
		'ROE': xirr, // ROE equals IRR in this model
		'Additional Equity': additionalEquity,
		'Operating CF': operatingCF,
		'Levered FCF': leveredCF,
		'Revenue': revenues,
		'Raw Revenue': rawRevenues,
		'Insurance': insurance,
		'Property Tax': propertyTax,
		'HOA': hoa,
		'Maintenance': maintenance,
		'Management Fee': managementFee,
		'Property Price': propertyPriceArray,
		'Appraised Value': propertyAssessmentArray,
		
		// New equity metrics
		'Equity Contributions': equityContributions,
		'Equity Distributions': equityDistributions,
		'Total Equity Invested': totalEquityContributions,
		'Total Equity Returned': totalEquityDistributions,
		'Cumulative Contributions': cumulativeContributions,
		'Cumulative Distributions': cumulativeDistributions,
		'Net Equity': netEquity,
		
		// Debt service components
		'IM Principal': imPrincipal,
		'IM Interest': imInterest,
		'IM Extra Payments': imExtra,
		'IM Debt Service': imDebtService,
		'IM Balance': imBalances,
		'HEL Principal': helPrincipal,
		'HEL Interest': helInterest,
		'HEL Extra Payments': helExtra,
		'HEL Debt Service': helDebtService,
		'HEL Balance': helBalances,
		'RM Principal': rmPrincipal,
		'RM Interest': rmInterest,
		'RM Extra Payments': rmExtra,
		'RM Debt Service': rmDebtService,
		'RM Balance': rmBalances,
		'Total Debt Service': totalDebtService,
		'Total Debt Balance': totalDebt,
		
		// Home sale details
		'Home Sale Components': {
			'Property Value': homeSalePrice,
			'Initial Mortgage Balance': imEOPBalance,
			'Home Equity Loan Balance': helEOPBalance,
			'Refinanced Mortgage Balance': rmEOPBalance,
			'Net Sale Proceeds': homeSaleProceeds
		}
	};
	
	return model_outputs;
}

// Example of how to use processFormDictionary and call calculateSourcesAndUses
document.addEventListener('DOMContentLoaded', function () {
	
    // Listen for the custom event triggered by evaluate.js when formDictionary changes
    document.addEventListener('formDictionaryChanged', function (event) {
        window.sourcesAndUses = calculateSourcesAndUses(activeDictionary); // Call the function to calculate sources and uses
		monthsDF = get_months_and_flags(activeDictionary);
		window.debtService = calculate_debt_service(monthsDF, activeDictionary);
		window.financialOutputs = calculate_cash_flows(monthsDF, activeDictionary, debtService);
		console.log(financialOutputs)
    });

    // Initial call on page load
    const activeDictionary = window.formDictionary
    window.sourcesAndUses = calculateSourcesAndUses(activeDictionary);
	
	// Example usage:
	let monthsDF = get_months_and_flags(activeDictionary);
	
	window.debtService = calculate_debt_service(monthsDF, activeDictionary);
	window.financialOutputs = calculate_cash_flows(monthsDF, activeDictionary, debtService);
	console.log(financialOutputs)
	
});

