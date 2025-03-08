import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const StablecoinDashboard = ({ account, contract }) => {
    // State variables
    const [currentTab, setCurrentTab] = useState('dashboard');
    const [txPending, setTxPending] = useState(false);
    const [txStatus, setTxStatus] = useState('');

    // Account information
    const [leafBalance, setLeafBalance] = useState('0');
    const [collateralValue, setCollateralValue] = useState('0');
    const [healthFactor, setHealthFactor] = useState('0');
    const [availableCollaterals, setAvailableCollaterals] = useState([]);

    // Input values
    const [selectedCollateral, setSelectedCollateral] = useState('');
    const [collateralAmount, setCollateralAmount] = useState('');
    const [leafAmount, setLeafAmount] = useState('');
    const [debtToCover, setDebtToCover] = useState('');
    const [userToLiquidate, setUserToLiquidate] = useState('');

    // Fetch account information
    useEffect(() => {
        if (contract && account) {
            fetchAccountData();
            fetchAvailableCollaterals();
        }
    }, [contract, account]);

    const fetchAccountData = async () => {
        try {
            // Get user LEAF balance (assuming LEAF is an ERC20 token)
            const leafToken = await contract.getLeaf();
            const leafTokenContract = new ethers.Contract(
                leafToken,
                ['function balanceOf(address) view returns (uint256)'],
                contract.provider
            );
            const balance = await leafTokenContract.balanceOf(account);
            setLeafBalance(ethers.formatUnits(balance, 18));

            // Get account information
            const accountInfo = await contract.getAccountInformation(account);
            setCollateralValue(ethers.formatUnits(accountInfo.collateralValueInUsd, 18));

            // Get health factor
            try {
                const hf = await contract.getHealthFactor(account);
                setHealthFactor(ethers.formatUnits(hf, 18));
            } catch (error) {
                // Some accounts might not have a health factor yet
                setHealthFactor('∞');
            }
        } catch (error) {
            console.error('Error fetching account data:', error);
        }
    };

    const fetchAvailableCollaterals = async () => {
        try {
            const tokens = await contract.getCollateralTokens();
            setAvailableCollaterals(tokens);
            if (tokens.length > 0) {
                setSelectedCollateral(tokens[0]);
            }
        } catch (error) {
            console.error('Error fetching collateral tokens:', error);
        }
    };

    // Transaction helper
    const executeTransaction = async (transactionFn, successMessage) => {
        try {
            setTxPending(true);
            setTxStatus('Submitting transaction...');

            const tx = await transactionFn();

            setTxStatus('Transaction submitted. Waiting for confirmation...');
            await tx.wait();

            setTxStatus(successMessage);
            await fetchAccountData();
        } catch (error) {
            console.error('Transaction error:', error);
            setTxStatus(`Error: ${error.message || 'Transaction failed'}`);
        } finally {
            setTxPending(false);
            setTimeout(() => setTxStatus(''), 5000);
        }
    };

    // Contract interaction functions
    const handleDepositCollateral = async () => {
        if (!contract || !selectedCollateral || !collateralAmount) return;

        // Need to approve the token transfer first if it's an ERC20 token
        const tokenContract = new ethers.Contract(
            selectedCollateral,
            ['function approve(address, uint256) returns (bool)', 'function decimals() view returns (uint8)'],
            contract.provider.getSigner()
        );

        try {
            const decimals = await tokenContract.decimals();
            const amount = ethers.parseUnits(collateralAmount, decimals);

            // Approve token transfer
            setTxStatus('Approving token transfer...');
            const approveTx = await tokenContract.approve(await contract.getAddress(), amount);
            await approveTx.wait();

            // Deposit collateral
            await executeTransaction(
                () => contract.depositCollateral(selectedCollateral, amount),
                'Collateral deposited successfully!'
            );

            setCollateralAmount('');
        } catch (error) {
            console.error('Deposit error:', error);
            setTxStatus(`Error: ${error.message || 'Deposit failed'}`);
            setTxPending(false);
        }
    };

    const handleMintLEAF = async () => {
        if (!contract || !leafAmount) return;

        await executeTransaction(
            () => contract.mintLEAF(ethers.parseUnits(leafAmount, 18)),
            'LEAF tokens minted successfully!'
        );

        setLeafAmount('');
    };

    const handleDepositAndMint = async () => {
        if (!contract || !selectedCollateral || !collateralAmount || !leafAmount) return;

        // Need to approve the token transfer first if it's an ERC20 token
        const tokenContract = new ethers.Contract(
            selectedCollateral,
            ['function approve(address, uint256) returns (bool)', 'function decimals() view returns (uint8)'],
            contract.provider.getSigner()
        );

        try {
            const decimals = await tokenContract.decimals();
            const amount = ethers.parseUnits(collateralAmount, decimals);
            const leafToMint = ethers.parseUnits(leafAmount, 18);

            // Approve token transfer
            setTxStatus('Approving token transfer...');
            const approveTx = await tokenContract.approve(await contract.getAddress(), amount);
            await approveTx.wait();

            // Deposit collateral and mint LEAF
            await executeTransaction(
                () => contract.depositCollateralAndMintLEAF(selectedCollateral, amount, leafToMint),
                'Collateral deposited and LEAF minted successfully!'
            );

            setCollateralAmount('');
            setLeafAmount('');
        } catch (error) {
            console.error('Deposit and mint error:', error);
            setTxStatus(`Error: ${error.message || 'Operation failed'}`);
            setTxPending(false);
        }
    };

    const handleBurnLEAF = async () => {
        if (!contract || !leafAmount) return;

        await executeTransaction(
            () => contract.burnLEAF(ethers.parseUnits(leafAmount, 18)),
            'LEAF tokens burned successfully!'
        );

        setLeafAmount('');
    };

    const handleRedeemCollateral = async () => {
        if (!contract || !selectedCollateral || !collateralAmount) return;

        try {
            const tokenContract = new ethers.Contract(
                selectedCollateral,
                ['function decimals() view returns (uint8)'],
                contract.provider
            );
            const decimals = await tokenContract.decimals();

            await executeTransaction(
                () => contract.redeemCollateral(selectedCollateral, ethers.parseUnits(collateralAmount, decimals)),
                'Collateral redeemed successfully!'
            );

            setCollateralAmount('');
        } catch (error) {
            console.error('Redeem error:', error);
            setTxStatus(`Error: ${error.message || 'Redeem failed'}`);
            setTxPending(false);
        }
    };

    const handleRedeemCollateralForLEAF = async () => {
        if (!contract || !selectedCollateral || !collateralAmount || !leafAmount) return;

        try {
            const tokenContract = new ethers.Contract(
                selectedCollateral,
                ['function decimals() view returns (uint8)'],
                contract.provider
            );
            const decimals = await tokenContract.decimals();

            await executeTransaction(
                () => contract.redeemCollateralForLEAF(
                    selectedCollateral,
                    ethers.parseUnits(collateralAmount, decimals),
                    ethers.parseUnits(leafAmount, 18)
                ),
                'Collateral redeemed for LEAF successfully!'
            );

            setCollateralAmount('');
            setLeafAmount('');
        } catch (error) {
            console.error('Redeem for LEAF error:', error);
            setTxStatus(`Error: ${error.message || 'Operation failed'}`);
            setTxPending(false);
        }
    };

    const handleLiquidate = async () => {
        if (!contract || !selectedCollateral || !userToLiquidate || !debtToCover) return;

        await executeTransaction(
            () => contract.liquidate(
                selectedCollateral,
                userToLiquidate,
                ethers.parseUnits(debtToCover, 18)
            ),
            'Liquidation successful!'
        );

        setUserToLiquidate('');
        setDebtToCover('');
    };

    return (
        <div className="dashboard-container">
            <div className="balance-card">
                <h2>Your Account</h2>
                <div className="account-stats">
                    <div className="stat-item">
                        <h3>LEAF Balance</h3>
                        <p className="balance-amount">{parseFloat(leafBalance).toFixed(4)} LEAF</p>
                    </div>
                    <div className="stat-item">
                        <h3>Collateral Value</h3>
                        <p className="balance-amount">${parseFloat(collateralValue).toFixed(2)}</p>
                    </div>
                    <div className="stat-item">
                        <h3>Health Factor</h3>
                        <p className={`balance-amount ${parseFloat(healthFactor) < 1.2 ? 'danger' : ''}`}>
                            {healthFactor === '∞' ? '∞' : parseFloat(healthFactor).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="action-tabs">
                <div className="tab-headers">
                    <button
                        className={`tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setCurrentTab('dashboard')}
                    >
                        Dashboard
                    </button>
                    <button
                        className={`tab-btn ${currentTab === 'deposit' ? 'active' : ''}`}
                        onClick={() => setCurrentTab('deposit')}
                    >
                        Deposit
                    </button>
                    <button
                        className={`tab-btn ${currentTab === 'mint' ? 'active' : ''}`}
                        onClick={() => setCurrentTab('mint')}
                    >
                        Mint
                    </button>
                    <button
                        className={`tab-btn ${currentTab === 'redeem' ? 'active' : ''}`}
                        onClick={() => setCurrentTab('redeem')}
                    >
                        Redeem
                    </button>
                    <button
                        className={`tab-btn ${currentTab === 'burn' ? 'active' : ''}`}
                        onClick={() => setCurrentTab('burn')}
                    >
                        Burn
                    </button>
                    <button
                        className={`tab-btn ${currentTab === 'liquidate' ? 'active' : ''}`}
                        onClick={() => setCurrentTab('liquidate')}
                    >
                        Liquidate
                    </button>
                </div>

                <div className="tab-content">
                    {txStatus && <div className={`tx-status ${txStatus.includes('Error') ? 'error' : ''}`}>{txStatus}</div>}

                    {currentTab === 'dashboard' && (
                        <div className="dashboard-tab">
                            <h3>Account Overview</h3>
                            <p>View and manage your LEAF stablecoin position</p>

                            <div className="info-box">
                                <h4>What is Health Factor?</h4>
                                <p>
                                    The health factor represents the safety of your position. If it falls below 1.0,
                                    your position may be liquidated. Maintain a health factor above 1.2 to be safe.
                                </p>
                            </div>
                        </div>
                    )}

                    {currentTab === 'deposit' && (
                        <div className="deposit-tab">
                            <h3>Deposit Collateral</h3>
                            <p>Deposit tokens as collateral to support your LEAF position</p>

                            <div className="form-group">
                                <label>Select Collateral</label>
                                <select
                                    value={selectedCollateral}
                                    onChange={(e) => setSelectedCollateral(e.target.value)}
                                    disabled={txPending || availableCollaterals.length === 0}
                                >
                                    {availableCollaterals.map((token) => (
                                        <option key={token} value={token}>
                                            {token}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Amount to Deposit</label>
                                <input
                                    type="number"
                                    placeholder="0.0"
                                    value={collateralAmount}
                                    onChange={(e) => setCollateralAmount(e.target.value)}
                                    disabled={txPending}
                                />
                            </div>

                            <button
                                className="action-button"
                                onClick={handleDepositCollateral}
                                disabled={!selectedCollateral || !collateralAmount || txPending}
                            >
                                {txPending ? 'Processing...' : 'Deposit Collateral'}
                            </button>

                            <div className="form-divider">
                                <span>OR</span>
                            </div>

                            <h3>Deposit and Mint in One Transaction</h3>

                            <div className="form-group">
                                <label>Amount of LEAF to Mint</label>
                                <input
                                    type="number"
                                    placeholder="0.0"
                                    value={leafAmount}
                                    onChange={(e) => setLeafAmount(e.target.value)}
                                    disabled={txPending}
                                />
                            </div>

                            <button
                                className="action-button"
                                onClick={handleDepositAndMint}
                                disabled={!selectedCollateral || !collateralAmount || !leafAmount || txPending}
                            >
                                {txPending ? 'Processing...' : 'Deposit and Mint'}
                            </button>
                        </div>
                    )}

                    {currentTab === 'mint' && (
                        <div className="mint-tab">
                            <h3>Mint LEAF Tokens</h3>
                            <p>Create new LEAF tokens using your existing collateral</p>

                            <div className="form-group">
                                <label>Amount of LEAF to Mint</label>
                                <input
                                    type="number"
                                    placeholder="0.0"
                                    value={leafAmount}
                                    onChange={(e) => setLeafAmount(e.target.value)}
                                    disabled={txPending}
                                />
                            </div>

                            <button
                                className="action-button"
                                onClick={handleMintLEAF}
                                disabled={!leafAmount || txPending}
                            >
                                {txPending ? 'Processing...' : 'Mint LEAF'}
                            </button>

                            <div className="info-box">
                                <p>Note: Minting will decrease your health factor. Ensure your position remains safe.</p>
                            </div>
                        </div>
                    )}

                    {currentTab === 'redeem' && (
                        <div className="redeem-tab">
                            <h3>Redeem Collateral</h3>
                            <p>Withdraw your collateral from the protocol</p>

                            <div className="form-group">
                                <label>Select Collateral</label>
                                <select
                                    value={selectedCollateral}
                                    onChange={(e) => setSelectedCollateral(e.target.value)}
                                    disabled={txPending || availableCollaterals.length === 0}
                                >
                                    {availableCollaterals.map((token) => (
                                        <option key={token} value={token}>
                                            {token}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Amount to Redeem</label>
                                <input
                                    type="number"
                                    placeholder="0.0"
                                    value={collateralAmount}
                                    onChange={(e) => setCollateralAmount(e.target.value)}
                                    disabled={txPending}
                                />
                            </div>

                            <button
                                className="action-button"
                                onClick={handleRedeemCollateral}
                                disabled={!selectedCollateral || !collateralAmount || txPending}
                            >
                                {txPending ? 'Processing...' : 'Redeem Collateral'}
                            </button>

                            <div className="form-divider">
                                <span>OR</span>
                            </div>

                            <h3>Redeem Collateral and Burn LEAF</h3>

                            <div className="form-group">
                                <label>Amount of LEAF to Burn</label>
                                <input
                                    type="number"
                                    placeholder="0.0"
                                    value={leafAmount}
                                    onChange={(e) => setLeafAmount(e.target.value)}
                                    disabled={txPending}
                                />
                            </div>

                            <button
                                className="action-button"
                                onClick={handleRedeemCollateralForLEAF}
                                disabled={!selectedCollateral || !collateralAmount || !leafAmount || txPending}
                            >
                                {txPending ? 'Processing...' : 'Redeem and Burn'}
                            </button>
                        </div>
                    )}

                    {currentTab === 'burn' && (
                        <div className="burn-tab">
                            <h3>Burn LEAF Tokens</h3>
                            <p>Destroy LEAF tokens to improve your health factor</p>

                            <div className="form-group">
                                <label>Amount of LEAF to Burn</label>
                                <input
                                    type="number"
                                    placeholder="0.0"
                                    value={leafAmount}
                                    onChange={(e) => setLeafAmount(e.target.value)}
                                    disabled={txPending}
                                />
                            </div>

                            <button
                                className="action-button"
                                onClick={handleBurnLEAF}
                                disabled={!leafAmount || txPending}
                            >
                                {txPending ? 'Processing...' : 'Burn LEAF'}
                            </button>

                            <div className="info-box">
                                <p>Note: Burning LEAF will improve your health factor by reducing your debt.</p>
                            </div>
                        </div>
                    )}

                    {currentTab === 'liquidate' && (
                        <div className="liquidate-tab">
                            <h3>Liquidate Position</h3>
                            <p>Liquidate an unhealthy position to earn a bonus</p>

                            <div className="form-group">
                                <label>User Address to Liquidate</label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    value={userToLiquidate}
                                    onChange={(e) => setUserToLiquidate(e.target.value)}
                                    disabled={txPending}
                                />
                            </div>

                            <div className="form-group">
                                <label>Select Collateral</label>
                                <select
                                    value={selectedCollateral}
                                    onChange={(e) => setSelectedCollateral(e.target.value)}
                                    disabled={txPending || availableCollaterals.length === 0}
                                >
                                    {availableCollaterals.map((token) => (
                                        <option key={token} value={token}>
                                            {token}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Debt to Cover (LEAF)</label>
                                <input
                                    type="number"
                                    placeholder="0.0"
                                    value={debtToCover}
                                    onChange={(e) => setDebtToCover(e.target.value)}
                                    disabled={txPending}
                                />
                            </div>

                            <button
                                className="action-button"
                                onClick={handleLiquidate}
                                disabled={!userToLiquidate || !selectedCollateral || !debtToCover || txPending}
                            >
                                {txPending ? 'Processing...' : 'Liquidate Position'}
                            </button>

                            <div className="info-box warning">
                                <p>
                                    Warning: Only positions with a health factor below 1.0 can be liquidated.
                                    You need to have enough LEAF tokens to cover the specified debt.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StablecoinDashboard;