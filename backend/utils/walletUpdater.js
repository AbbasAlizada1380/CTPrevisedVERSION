// Update wallet after loan operations
export const updateWalletAfterLoan = async (
  wallet,
  amount,
  operation,
  transaction,
) => {
  if (operation === "create") {
    wallet.totalLoans = parseFloat(wallet.totalLoans) + parseFloat(amount);
    wallet.remainingBalance =
      parseFloat(wallet.remainingBalance) + parseFloat(amount);
  } else if (operation === "delete") {
    wallet.totalLoans = parseFloat(wallet.totalLoans) - parseFloat(amount);
    wallet.remainingBalance =
      parseFloat(wallet.remainingBalance) - parseFloat(amount);
  }

  await wallet.save({ transaction });
};

// Update wallet after payment
export const updateWalletAfterPayment = async (wallet, amount, transaction) => {
  wallet.totalPaid = parseFloat(wallet.totalPaid) + parseFloat(amount);
  wallet.remainingBalance =
    parseFloat(wallet.remainingBalance) - parseFloat(amount);

  await wallet.save({ transaction });
};
