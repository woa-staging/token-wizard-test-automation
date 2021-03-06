let test = require('selenium-webdriver/testing');
let assert = require('assert');
const fs = require('fs-extra');
///////////////////////////////////////////////////////
const WizardWelcome = require('../pages/WizardWelcome.js').WizardWelcome;
const WizardStep1 = require('../pages/WizardStep1.js').WizardStep1;
const WizardStep2 = require('../pages/WizardStep2.js').WizardStep2;
const WizardStep3 = require('../pages/WizardStep3.js').WizardStep3;
const WizardStep4 = require('../pages/WizardStep4.js').WizardStep4;
const TierPage = require('../pages/TierPage.js').TierPage;
const ReservedTokensPage = require('../pages/ReservedTokensPage.js').ReservedTokensPage;
const CrowdsalePage = require('../pages/CrowdsalePage.js').CrowdsalePage;
const InvestPage = require('../pages/ContributionPage.js').InvestPage;
const ManagePage = require('../pages/ManagePage.js').ManagePage;
const logger = require('../entity/Logger.js').logger;
const tempOutputPath = require('../entity/Logger.js').tempOutputPath;
const Utils = require('../utils/Utils.js').Utils;
const User = require("../entity/User.js").User;
const smallAmount = 0.1;

test.describe(`e2e test for TokenWizard2.0/DutchAuctionCrowdsale. v ${testVersion} `, async function () {
	this.timeout(2400000);//40 min
	this.slow(1800000);

	const user8545_dDdCFile = './users/user8545_dDdC.json';//Owner
	const user8545_Db0EFile = './users/user8545_Db0E.json';//Investor1 - whitelisted before deployment
	const user8545_F16AFile = './users/user8545_F16A.json';//Investor2 - whitelisted before deployment
	const scenarioE2eMinCap = './scenarios/scenarioE2eDutchMincapLong.json';
	const scenarioE2eWhitelist = './scenarios/scenarioE2eDutchWhitelistShort.json';
	const scenarioForUItests = './scenarios/scenarioUItests.json';
	const scenarioE2eDutchCheckBurn = './scenarios/scenarioE2eDutchCheckBurn.json';
	let driver;
	let Owner;
	let Investor1;
	let Investor2;

	let wallet;
	let welcomePage;
	let wizardStep1;
	let wizardStep2;
	let wizardStep3;
	let wizardStep4;
	let tierPage;
	let mngPage;
	let reservedTokensPage;
	let investPage;
	let startURL;
	let crowdsaleForUItests;
	let e2eMinCap;
	let e2eWhitelist;
	let e2eCheckBurn;
	let balanceEthOwnerBefore;
	let balanceEthOwnerAfter;

/////////////////////////////////////////////////////////////////////////

	test.before(async function () {

		await Utils.copyEnvFromWizard();
		e2eMinCap = await Utils.getDutchCrowdsaleInstance(scenarioE2eMinCap);

		e2eWhitelist = await Utils.getDutchCrowdsaleInstance(scenarioE2eWhitelist);
		crowdsaleForUItests = await Utils.getDutchCrowdsaleInstance(scenarioForUItests);

		e2eCheckBurn = await Utils.getDutchCrowdsaleInstance(scenarioE2eDutchCheckBurn);

		startURL = await Utils.getStartURL();
		driver = await Utils.startBrowserWithWallet();

		Owner = new User(driver, user8545_dDdCFile);
		Owner.tokenBalance = 0;
		Investor1 = new User(driver, user8545_Db0EFile);
		Investor1.tokenBalance = 0;
		Investor2 = new User(driver, user8545_F16AFile);
		Investor2.minCap = e2eWhitelist.tiers[0].whitelist[0].min;
		Investor2.maxCap = e2eWhitelist.tiers[0].whitelist[0].max;
		Investor2.tokenBalance = 0;

		await Utils.receiveEth(Owner, 20);
		await Utils.receiveEth(Investor1, 20);
		await Utils.receiveEth(Investor2, 20);
		logger.info("Roles:");
		logger.info("Owner = " + Owner.account);
		logger.info("Owner's balance = :" + await Utils.getBalance(Owner) / 1e18);
		logger.info("Investor1  = " + Investor1.account);
		logger.info("Investor1 balance = :" + await Utils.getBalance(Investor1) / 1e18);
		logger.info("Investor2  = " + Investor2.account);
		logger.info("Investor2 balance = :" + await Utils.getBalance(Investor2) / 1e18);

		wallet = await Utils.getWalletInstance(driver);
		await wallet.activate();//return activated Wallet and empty page
		await Owner.setWalletAccount();

		welcomePage = new WizardWelcome(driver, startURL);
		wizardStep1 = new WizardStep1(driver);
		wizardStep2 = new WizardStep2(driver);
		wizardStep3 = new WizardStep3(driver);
		wizardStep4 = new WizardStep4(driver);
		investPage = new InvestPage(driver);
		reservedTokensPage = new ReservedTokensPage(driver);
		mngPage = new ManagePage(driver);
		tierPage = new TierPage(driver, crowdsaleForUItests.tiers[0]);

	});

	test.after(async function () {
		// Utils.killProcess(ganache);
		//await Utils.sendEmail(tempOutputFile);
		let outputPath = Utils.getOutputPath();
		outputPath = outputPath + "/result" + Utils.getDate();
		await fs.ensureDirSync(outputPath);
		await fs.copySync(tempOutputPath, outputPath);
		//await fs.remove(tempOutputPath);
		//await driver.quit();
	});

	//////// UI TESTS ////////////////////////////////////////////////
	/*
	test.it('User is able to open wizard welcome page',
		async function () {
			await  welcomePage.open();
			let result = await welcomePage.waitUntilDisplayedButtonNewCrowdsale(180);
			return await assert.equal(result, true, "Test FAILED. Wizard's page is not available ");
		});

	test.it('Welcome page: button NewCrowdsale present ',
		async function () {
			let result = await welcomePage.isDisplayedButtonNewCrowdsale();
			return await assert.equal(result, true, "Test FAILED. Button NewCrowdsale not present ");
		});

	test.it('Welcome page: button ChooseContract present ',
		async function () {
			let result = await welcomePage.isDisplayedButtonChooseContract();
			return await assert.equal(result, true, "Test FAILED. button ChooseContract not present ");
		});

	test.it('Welcome page: user is able to open Step1 by clicking button NewCrowdsale ',
		async function () {
			await welcomePage.clickButtonNewCrowdsale();
			let result = await wizardStep1.isDisplayedButtonContinue();
			return await assert.equal(result, true, "Test FAILED. User is not able to activate Step1 by clicking button NewCrowdsale");
		});

	test.it('Wizard step#1: user is able to click DutchAuction checkbox ',
		async function () {
			let result = await wizardStep1.waitUntilDisplayedCheckboxDutchAuction()
				&& await wizardStep1.clickCheckboxDutchAuction();
			return await assert.equal(result, true, "Test FAILED. User is not able to to click DutchAuction checkbox");
		});

	test.it('Wizard step#1: user is able to open Step2 by clicking button Continue ',
		async function () {
			let count = 10;
			do {
				await driver.sleep(1000);
				if ((await wizardStep1.isDisplayedButtonContinue()) &&
					!(await wizardStep2.isDisplayedFieldName())) {
					await wizardStep1.clickButtonContinue();
				}
				else break;
			}
			while (count-- > 0);
			let result = await wizardStep2.isDisplayedFieldName();
			return await assert.equal(result, true, "Test FAILED. User is not able to open Step2 by clicking button Continue");

		});
	test.it('Wizard step#2:Check persistant if account has changed ',
		async function () {
			let investor = Investor1;
			let owner = Owner;
			assert.equal(await investor.setMetaMaskAccount(), true, "Can not set Metamask account");
			assert.equal(await wizardStep2.isDisplayedFieldSupply(), true, "Field 'Supply' is not displayed");
			assert.equal(await owner.setMetaMaskAccount(), true, "Can not set Metamask account");
			return assert.equal(await wizardStep2.isDisplayedFieldSupply(), true, "Persistant failed if account has changed");
		});
	test.it.skip('Wizard step#2:Check persistant if page refreshed ',
		async function () {
			let investor = Investor1;
			let owner = Owner;

			return assert.equal(false, true, "Persistant failed if account has changed");
		});
	test.it('Wizard step#2: user able to fill out Name field with valid data',
		async function () {
			await wizardStep2.fillName("name");
			let result = await wizardStep2.isDisplayedWarningName();
			return await assert.equal(result, false, "Test FAILED. Wizard step#2: user able to fill Name field with valid data ");
		});

	test.it('Wizard step#2: user able to fill out field Ticker with valid data',
		async function () {
			await wizardStep2.fillTicker("test");
			let result = await wizardStep2.isDisplayedWarningTicker();
			return await assert.equal(result, false, "Test FAILED. Wizard step#2: user is not  able to fill out field Ticker with valid data ");
		});

	test.it('Wizard step#2: user able to fill out  Decimals field with valid data',
		async function () {
			await wizardStep2.fillDecimals("18");
			let result = await wizardStep2.isDisplayedWarningDecimals();
			return await assert.equal(result, false, "Test FAILED. Wizard step#2: user is not able to fill Decimals  field with valid data ");
		});

	test.it('Wizard step#2: user able to fill out  Total supply field with valid data',
		async function () {
			await wizardStep2.fillSupply(crowdsaleForUItests.totalSupply);
			let result = await wizardStep2.isDisplayedWarningSupply();
			return await assert.equal(result, false, "Test FAILED. Wizard step#2: user is not able to fill Total supply  field with valid data ");
		});

	test.it('Wizard step#2: button Continue is displayed and enabled',
		async function () {
			let result = await wizardStep2.isDisplayedButtonContinue();
			return await assert.equal(result, true, "Test FAILED. Wizard step#2: button Continue disabled or not displayed  ");
		});

	test.it('Wizard step#2: user is able to open Step3 by clicking button Continue ',
		async function () {
			await wizardStep2.clickButtonContinue();
			await wizardStep3.waitUntilDisplayedTitle(180);
			let result = await wizardStep3.getTitleText();
			result = (result === wizardStep3.title);
			return await assert.equal(result, true, "Test FAILED. User is not able to open Step3 by clicking button Continue");
		});

	test.it('Wizard step#3: field Wallet address contains current metamask account address  ',
		async function () {

			let result = await wizardStep3.getValueFieldWalletAddress();
			result = (result === Owner.account.toString());
			return await assert.equal(result, true, "Test FAILED. Wallet address does not match the metamask account address ");
		});

	test.it('Tier#1: Whitelist container present if checkbox "Whitelist enabled" is selected',
		async function () {
			let result = await tierPage.setWhitelisting()
				&& await tierPage.isDisplayedWhitelistContainer();
			return await  assert.equal(result, true, "Test FAILED. Wizard step#3: User is NOT able to set checkbox  'Whitelist enabled'");
		});

	test.it('Wizard step#3: field minCap disabled if whitelist enabled ',
		async function () {
			let result = await wizardStep3.isDisabledMinCap();
			return await assert.equal(result, true, "Test FAILED. Field minCap enabled if whitelist enabled");
		});

	test.it('Wizard step#3: User is able to download CSV file with whitelisted addresses',
		async function () {

			let result = await tierPage.uploadWhitelistCSVFile();
			await wizardStep3.clickButtonOk();
			return await assert.equal(result, true, 'Test FAILED. Wizard step#3: User is NOT able to download CVS file with whitelisted addresses');
		});

	test.it('Wizard step#3: Number of added whitelisted addresses is correct, data is valid',
		async function () {
			let shouldBe = 6;
			let inReality = await tierPage.amountAddedWhitelist();
			return await assert.equal(shouldBe, inReality, "Test FAILED. Wizard step#3: Number of added whitelisted addresses is not correct");

		});

	test.it('Wizard step#3: User is able to bulk delete all whitelisted addresses ',
		async function () {
			let result = await tierPage.clickButtonClearAll()
				&& await tierPage.waitUntilShowUpPopupConfirm(180)
				&& await tierPage.clickButtonYesAlert();
			return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is not able to bulk delete all whitelisted addresses");
		});

	test.it('Wizard step#3: All whitelisted addresses are removed after deletion ',
		async function () {
			let result = await tierPage.amountAddedWhitelist(10);
			return await assert.equal(result, 0, "Test FAILED. Wizard step#3: User is NOT able to bulk delete all whitelisted addresses");
		});

	test.it('Wizard step#3: User is able to add several whitelisted addresses one by one ',
		async function () {
			let result = await tierPage.fillWhitelist();
			return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is able to add several whitelisted addresses");
		});

	test.it('Wizard step#3: User is able to remove one whitelisted address',
		async function () {
			let beforeRemoving = await tierPage.amountAddedWhitelist();
			let numberAddressForRemove = 1;
			await tierPage.removeWhiteList(numberAddressForRemove - 1);
			let afterRemoving = await tierPage.amountAddedWhitelist();
			return await assert.equal(beforeRemoving, afterRemoving + 1, "Test FAILED. Wizard step#3: User is NOT able to remove one whitelisted address");
		});

	test.it("Wizard step#3: User is able to set 'Custom Gasprice' checkbox",
		async function () {

			let result = await wizardStep3.clickCheckboxGasCustom();
			return await assert.equal(result, true, "Test FAILED. User is not able to set 'Custom Gasprice' checkbox");

		});

	test.it(" Wizard step#3: User is able to fill out the  'CustomGasprice' field with valid value",
		async function () {
			let customValue = 100;
			let result = await wizardStep3.fillGasPriceCustom(customValue);
			return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is NOT able to fill 'Custom Gasprice' with valid value");
		});

	test.it('Wizard step#3: User is able to set SafeAndCheapGasprice checkbox ',
		async function () {
			let result = await wizardStep3.clickCheckboxGasSafe();
			return await assert.equal(result, true, "Test FAILED. Wizard step#3: 'Safe and cheap' Gas price checkbox does not set by default");
		});
	test.it('Wizard step#3:Tier#1: User is able to fill out field Supply with valid data ',
		async function () {
			tierPage.tier.supply = crowdsaleForUItests.totalSupply - 1;
			let result = await tierPage.fillSupply();
			return await assert.equal(result, true, "Test FAILED. Wizard step#3:Tier#1: User is notable to fill out field Supply with valid data");

		});
	test.it("Wizard step#3:Tier#1: User is able to fill out field 'minRate' with valid data",
		async function () {
			tierPage.tier.minRate = 100;
			let result = await tierPage.fillMinRate();
			return await assert.equal(result, true, "Test FAILED. Wizard step#3:Tier#1: User is not able to fill out field 'minRate' with valid data");
		});
	test.it("Wizard step#3:Tier#1: User is able to fill out field 'maxRate' with valid data",
		async function () {
			tierPage.tier.maxRate = 10;
			let result = await tierPage.fillMaxRate();
			return await assert.equal(result, true, "Test FAILED. Wizard step#3:Tier#1: User is not able to fill out field 'maxRate' with valid data");
		});

	test.it("Wizard step#3: Button 'Continue' disabled if minRate > maxRate ",
		async function () {
			let result = !await wizardStep3.isEnabledButtonContinue();
			return await assert.equal(result, true, "Test FAILED. Wizard step#3: Button 'Continue' enabled if minRate > maxRate");

		});
	test.it('Wizard step#3: User is able to fill out field maxRate with valid data ',
		async function () {
			tierPage.tier.maxRate = 1000;
			let result = await tierPage.fillMaxRate();
			return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is not able to fill out field maxRate with valid data");
		});

	test.it("Wizard step#3: Button 'Continue' disabled if crowdsaleSupply>totalSupply",
		async function () {
			tierPage.tier.supply = crowdsaleForUItests.totalSupply + 1;
			let result = await tierPage.fillSupply()
				&& !await wizardStep3.isEnabledButtonContinue();
			return await assert.equal(result, true, "Test FAILED. Wizard step#3: Button 'Continue' ensabled if crowdsaleSupply>totalSupply");

		});
	test.it('Wizard step#3:Tier#1: User is able to fill out field Supply with valid data ',
		async function () {
			tierPage.tier.supply = crowdsaleForUItests.totalSupply - 1;
			let result = await tierPage.fillSupply();
			return await assert.equal(result, true, "Test FAILED. Wizard step#3:Tier#1: User is not able to fill out field Supply with valid data");

		});
	test.it('Wizard step#3: user is able to proceed to Step4 by clicking button Continue ',
		async function () {
			let result = await wizardStep3.clickButtonContinue()
				&& await wizardStep4.waitUntilDisplayedModal(60);
			return await assert.equal(result, true, "Test FAILED. User is not able to open Step4 by clicking button Continue");
		});
	/////////////// STEP4 //////////////
	test.it('Wizard step#4: alert present if user reload the page ',
		async function () {
			await wizardStep4.refresh();
			await driver.sleep(2000);
			let result = await wizardStep4.isPresentAlert();
			return await assert.equal(result, true, "Test FAILED.  Alert does not present if user refresh the page");
		});

	test.it('Wizard step#4: user is able to accept alert after reloading the page ',
		async function () {

			let result = await wizardStep4.acceptAlert()
				&& await wizardStep4.waitUntilDisplayedModal(80);
			return await assert.equal(result, true, "Test FAILED. Wizard step#4: Modal does not present after user has accepted alert");
		});

	test.it('Wizard step#4: button SkipTransaction is  presented if user reject a transaction ',
		async function () {
			let result = await metaMask.rejectTransaction()
				&& await metaMask.rejectTransaction()
				&& await wizardStep4.isDisplayedButtonSkipTransaction();
			return await assert.equal(result, true, "Test FAILED. Wizard step#4: button'Skip transaction' does not present if user reject the transaction");
		});

	test.it('Wizard step#4: user is able to skip transaction ',
		async function () {

			let result = await wizardStep4.clickButtonSkipTransaction()
				&& await wizardStep4.waitUntilShowUpPopupConfirm(80)
				&& await wizardStep4.clickButtonYes();
			return await assert.equal(result, true, "Test FAILED.Wizard step#4:  user is not able to skip transaction");
		});

	test.it('Wizard step#4: alert is presented if user wants to leave the wizard ',
		async function () {

			let result = await  welcomePage.openWithAlertConfirmation();
			return await assert.equal(result, false, "Test FAILED. Wizard step#4: Alert does not present if user wants to leave the site");
		});

	test.it('Wizard step#4: User is able to stop deployment ',
		async function () {

			let result = await wizardStep4.waitUntilShowUpButtonCancelDeployment(80)
				&& await wizardStep4.clickButtonCancelDeployment()
				&& await wizardStep4.waitUntilShowUpPopupConfirm(80)
				&& await wizardStep4.clickButtonYes();

			return await assert.equal(result, true, "Test FAILED. Button 'Cancel' does not present");
		});
*/
	//////////////////////// Test SUITE #0 /////////////////////////////

	test.it('Owner can create crowdsale: 1 whitelisted address,duration 1 min',
		async function () {
			let owner = Owner;
			assert.equal(await owner.setWalletAccount(), true, "Can not set Metamask account");
			let result = await owner.createDutchAuctionCrowdsale(e2eCheckBurn);
			return await assert.equal(result, true, 'Test FAILED. Crowdsale has not created ');
		});
	test.it('Crowdsale starts as scheduled',
		async function () {
			let startTime;
			let counter = 180;
			do {
				startTime = await Utils.getDutchCrowdsaleStartTime(e2eCheckBurn);
				logger.info("wait " + Date.now());
				logger.info("wait " + startTime);
				await driver.sleep(1000);

			}
			while (counter-- > 0 && (Date.now() / 1000 <= startTime));
			return await assert.equal(counter > 0, true, 'Test FAILED. Tier has not start in time ');
		});
	test.it('Crowdsale has finished as scheduled',
		async function () {
			let endT;
			let counter = 180;
			do {
				endT = await Utils.getDutchCrowdsaleEndTime(e2eCheckBurn);
				logger.info("wait " + Date.now());
				logger.info("wait " + endT);
				await driver.sleep(1000);
			}
			while (counter-- > 0 && (Date.now() / 1000 <= endT));
			return await assert.equal(counter > 0, true, 'Test FAILED. Crowdsale has not finished in time ');
		});

	test.it('Owner is able to finalize (if crowdsale time is over but not all tokens have sold)',
		async function () {
			let owner = Owner;
			assert.equal(await owner.setWalletAccount(), true, "Can not set Metamask account");
			let result = await owner.finalize(e2eCheckBurn);
			return await assert.equal(result, true, "Test FAILED.'Owner can NOT finalize ");
		});

	test.it('Check if flag  `burn_exceed` works: Owner has  NOT received unsold tokens after finalization',
		async function () {
			let investor = Owner;
			let balance = await investor.getTokenBalance(e2eCheckBurn) / 1e18;
			let shouldBe = 0;
			logger.info("Investor should receive  = " + shouldBe);
			logger.info("Investor has received balance = " + balance);
			logger.info("Difference = " + (balance - shouldBe));

			console.log("Investor should receive  = " + shouldBe);
			console.log("Investor has received balance = " + balance);
			console.log("Difference = " + (balance - shouldBe));


			let result = (Math.abs(shouldBe - balance) < 1e-6);
			return await assert.equal(result, true, "Test FAILED.'Investor has received " + balance + " tokens instead " + shouldBe)
		});
	//////////////////////// Test SUITE #1 /////////////////////////////
	test.it('Owner can create crowdsale: 1 whitelisted address,duration 5 min',
		async function () {
			let owner = Owner;
			assert.equal(await owner.setWalletAccount(), true, "Can not set Metamask account");
			let result = await owner.createDutchAuctionCrowdsale(e2eWhitelist);
			return await assert.equal(result, true, 'Test FAILED. Crowdsale has not created ');
		});

	test.it("Contribution page: Countdown timer has correct status: 'TO START OF TIER1 '",
		async function () {
			let investor = Owner;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let result = await investPage.isCrowdsaleNotStarted();
			//console.log(await investPage.getStatusTimer())
			return await assert.equal(result, true, 'Test FAILED. Countdown timer has incorrect status ');
		});

	test.it("Invest page: Owner's balance has correct value (totalSupply-supply) ",
		async function () {
			balanceEthOwnerBefore = await Utils.getBalance(Owner);
			let owner = Owner;
			await owner.openContributionPage(e2eWhitelist);
			let balance = await owner.getBalanceFromInvestPage(e2eWhitelist);
			let shouldBe = e2eWhitelist.totalSupply - e2eWhitelist.tiers[0].supply;
			let result = (balance.toString() === shouldBe.toString());
			return await assert.equal(result, true, "Test FAILED. Owner's balance has incorrect value (totalSupply-supply)");
		});

	test.it('Whitelisted investor not able to buy before start of crowdsale ',
		async function () {
			let investor = Investor1;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = e2eWhitelist.tiers[0].whitelist[0].min;
			let result = await investor.contribute(contribution);
			return await assert.equal(result, false, "Test FAILED. Whitelisted investor can buy before the crowdsale started");
		});

	test.it('Manage page: owner is able to add whitelisted address before start of crowdsale',
		async function () {
			let owner = Owner;
			let investor = Investor2;
			assert.equal(await owner.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await owner.openManagePage(e2eWhitelist), true, 'Owner can not open manage page');
			let tierNumber = 1;
			let result = await owner.addWhitelistTier(tierNumber, investor.account, investor.minCap, investor.maxCap);
			return await assert.equal(result, true, 'Test FAILED.Owner is NOT able to add whitelisted address before start of crowdsale ');
		});

	test.it('Crowdsale starts as scheduled',
		async function () {
			let startTime;
			let counter = 180;
			do {
				startTime = await Utils.getDutchCrowdsaleStartTime(e2eWhitelist);
				logger.info("wait " + Date.now());
				logger.info("wait " + startTime);
				//console.log("Date.now() = " + Date.now());
				//console.log("startTime =  " + startTime);
				//console.log("counter"+counter);
				await driver.sleep(1000);

			}
			while (counter-- > 0 && (Date.now() / 1000 <= startTime));
			return await assert.equal(counter > 0, true, 'Test FAILED. Tier has not start in time ');
		});

	test.it("Contribution  page: Countdown timer has correct status: 'TO END OF TIER1 '",
		async function () {
			let investor = Owner;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let result = await investPage.isCurrentTier1();
			return await assert.equal(result, true, 'Test FAILED. Countdown timer has incorrect status ');
		});

	test.it("Contribution page: minContribution field is 'You are not allowed' for non-whitelisted investors",
		async function () {
			let investor = Owner;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let result = await investPage.getMinContribution();
			return await assert.equal(result, -1, 'Test FAILED. MinContribution value is incorrect');
		});
	test.it('Manage page: owner is able to add whitelisted address after start of crowdsale',
		async function () {
			let owner = Owner;
			assert.equal(await owner.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await owner.openManagePage(e2eWhitelist), true, 'Owner can not open manage page');
			let tierNumber = 1;
			owner.minCap = e2eWhitelist.tiers[0].supply / 10;
			owner.maxCap = e2eWhitelist.tiers[0].supply;
			let result = await owner.addWhitelistTier(tierNumber, owner.account, owner.minCap, owner.maxCap);
			return await assert.equal(result, true, 'Test FAILED.Owner is NOT able to add whitelisted address after start of crowdsale ');
		});

	test.it("Contribution page: minContribution field contains correct minCap value for whitelisted investor",
		async function () {
			let investor = Investor2;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let result = await investPage.getMinContribution();
			return await assert.equal(result, investor.minCap, 'Test FAILED. MinContribution value is incorrect ');
		});

	test.it('Whitelisted investor which was added before start can buy amount equal mincap',
		async function () {
			let investor = Investor2;
			//assert.equal(await investor.setMetaMaskAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = investor.minCap;
			investor.tokenBalance += contribution;
			let result = await investor.contribute(contribution);
			return await assert.equal(result, true, 'Test FAILED. Whitelisted investor that was added before start can not buy');
		});

	test.it('Whitelisted investor which was added after start can buy amount equal mincap',
		async function () {
			let investor = Owner;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = investor.minCap;
			investor.tokenBalance += contribution;
			let result = await investor.contribute(contribution);
			return await assert.equal(result, true, 'Test FAILED. Whitelisted investor that was added after start can not buy');
		});

	test.it('Whitelisted investor is not able to buy less than minCap in first transaction',
		async function () {
			let investor = Investor1;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = e2eWhitelist.tiers[0].whitelist[0].min * 0.5;
			let result = await investor.contribute(contribution);
			return await assert.equal(result, false, "Test FAILED.Investor can buy less than minCap in first transaction");
		});

	test.it('Whitelisted investor  can buy amount equal mincap',
		async function () {
			let investor = Investor1;
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = e2eWhitelist.tiers[0].whitelist[0].min;
			investor.tokenBalance += contribution;
			let result = await investor.contribute(contribution);
			return await assert.equal(result, true, 'Test FAILED. Investor can not buy amount = min');
		});
	test.it("Contribution page: Investor's balance is properly changed  after purchase ",
		async function () {
			let investor = Investor1;
			await investor.openContributionPage(e2eWhitelist);
			let newBalance = await investor.getBalanceFromInvestPage(e2eWhitelist);
			logger.info("newBalance=" + newBalance);
			logger.info("investor.tokenBalance=" + investor.tokenBalance);
			let result = (Math.abs(parseFloat(newBalance) - parseFloat(investor.tokenBalance)) < 250);
			return await assert.equal(result, true, "Test FAILED. Investor can  buy but balance did not changed");
		});

	test.it('Whitelisted investor  is able to buy less than mincap after first transaction',
		async function () {
			balanceEthOwnerBefore = await Utils.getBalance(Owner);
			let investor = Investor1;
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = e2eWhitelist.tiers[0].whitelist[0].min * 0.1;
			investor.tokenBalance += contribution;
			let result = await investor.contribute(contribution);
			return await assert.equal(result, true, "Test FAILED. Investor can NOT buy less than min after first transaction");

		});
	test.it('Whitelisted investor  is able to buy maxCap',
		async function () {

			let investor = Investor1;
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = e2eWhitelist.tiers[0].supply;
			investor.tokenBalance = Investor1.maxCap;
			let result = await investor.contribute(contribution);
			return await assert.equal(result, true, "Test FAILED.Investor can  buy more than assigned max");
		});

	test.it("Whitelisted investor's #1 balance limited by maxCap",
		async function () {
			let investor = Investor1;
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let newBalance = await investor.getBalanceFromInvestPage(e2eWhitelist);
			investor.tokenBalance = e2eWhitelist.tiers[0].whitelist[0].max;
			let result = (Math.abs(parseFloat(newBalance) - parseFloat(investor.tokenBalance)) < 500);
			return await assert.equal(result, true, "Test FAILED.Investor can  buy more than assigned max");

		});

	test.it('Crowdsale has finished as scheduled',
		async function () {
			let endT;
			let counter = 180;
			do {
				endT = await Utils.getDutchCrowdsaleEndTime(e2eWhitelist);
				logger.info("wait " + Date.now());
				logger.info("wait " + endT);
				//console.log("Date.now() = " + Date.now());
				//console.log("endTime =  " + endT);
				//console.log("counter"+counter);
				await driver.sleep(1000);
			}
			while (counter-- > 0 && (Date.now() / 1000 <= endT));
			return await assert.equal(counter > 0, true, 'Test FAILED. Crowdsale has not finished in time ');
		});

	test.it("Contribution page: Countdown timer has correct status: 'CROWDSALE HAS ENDED'",
		async function () {
			let investor = Owner;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let result = await investPage.isCrowdsaleEnded();
			//console.log("result = "+result);
			return await assert.equal(result, true, 'Test FAILED. Countdown timer has incorrect status ');
		});

	test.it('Whitelisted investor is not able to buy if crowdsale finished',
		async function () {
			let investor = Investor2;
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = e2eWhitelist.tiers[0].supply;
			return await assert.equal(await investor.contribute(contribution), false, 'Whitelisted investor is able to buy if crowdsale finalized');
		});
	test.it('Not owner is not able to finalize',
		async function () {
			let investor = Investor1;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			let result = await investor.finalize(e2eWhitelist);
			return await assert.equal(result, false, "Test FAILED.'Not Owner can finalize ");
		});
	test.it('Owner has received correct quantity of tokens ',
		async function () {
			let investor = Owner;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			await investor.openContributionPage(e2eWhitelist);
			let shouldBe = parseFloat(await investor.getBalanceFromInvestPage(e2eWhitelist));
			let balance = await investor.getTokenBalance(e2eWhitelist) / 1e18;
			balanceEthOwnerBefore = balance;
			logger.info("Investor should receive  = " + shouldBe);
			logger.info("Investor has received balance = " + balance);
			logger.info("Difference = " + (balance - shouldBe));
			let result = (Math.abs(shouldBe - balance) < 1e-6);
			return await assert.equal(result, true, "Test FAILED.'Investor has received " + balance + " tokens instead " + shouldBe)
		});
	test.it('Owner is able to finalize (if crowdsale time is over but not all tokens have sold)',
		async function () {
			let owner = Owner;
			assert.equal(await owner.setWalletAccount(), true, "Can not set Metamask account");
			let result = await owner.finalize(e2eWhitelist);
			return await assert.equal(result, true, "Test FAILED.'Owner can NOT finalize ");
		});

	test.it("Contribution page: Countdown timer has correct status: 'HAS BEEN FINALIZED'",
		async function () {
			let investor = Owner;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eWhitelist), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let result = await investPage.isCrowdsaleFinalized();
			return await assert.equal(result, true, 'Test FAILED. Countdown timer are not displayed ');
		});
	test.it('Investor#1 has received correct quantity of tokens after finalization',
		async function () {

			let investor = Investor1;
			await investor.openContributionPage(e2eWhitelist);
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			let shouldBe = parseFloat(await investor.getBalanceFromInvestPage(e2eWhitelist));
			let balance = await investor.getTokenBalance(e2eWhitelist) / 1e18;
			logger.info("Investor should receive  = " + shouldBe);
			logger.info("Investor has received balance = " + balance);
			logger.info("Difference = " + (balance - shouldBe));
			let result = (Math.abs(shouldBe - balance) < 1e-6);
			return await assert.equal(result, true, "Test FAILED.'Investor has received " + balance + " tokens instead " + shouldBe)
		});

	test.it('Investor#2 has received correct quantity of tokens after finalization',
		async function () {
			let investor = Investor2;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			await investor.openContributionPage(e2eWhitelist);
			let shouldBe = parseFloat(await investor.getBalanceFromInvestPage(e2eWhitelist));
			let balance = await investor.getTokenBalance(e2eWhitelist) / 1e18;
			logger.info("Investor should receive  = " + shouldBe);
			logger.info("Investor has received balance = " + balance);
			logger.info("Difference = " + (balance - shouldBe));
			let result = (Math.abs(shouldBe - balance) < 1e-6);
			return await assert.equal(result, true, "Test FAILED.'Investor has received " + balance + " tokens instead " + shouldBe)
		});

	test.it('Check if flag  `burn_exceed` works: Owner has  received unsold tokens after finalization',
		async function () {
			let investor = Owner;

			let soldAmount = await Utils.getTokensSold(e2eWhitelist) / 1e18;
			let unsoldAmount = e2eWhitelist.tiers[0].supply - soldAmount;
			console.log("Owner should receive unsoldAmount = " + unsoldAmount);
			console.log("soldAmount = " + soldAmount);

			console.log("balanceOwnerBefore = " + balanceEthOwnerBefore);//Token balance before finalization
			let balance = await investor.getTokenBalance(e2eWhitelist) / 1e18;
			console.log("balanceOwnerAfter = " + balance);
			let delta = Math.abs(balanceEthOwnerBefore - balance)
			let result = (Math.abs(delta - unsoldAmount) < 1e-6);
			return await assert.equal(result, true, "Test FAILED.'Owner has additionaly  received " + balance + " tokens instead " + unsoldAmount)
		});

	//////////////////////// Test SUITE #2 /////////////////////////////

	test.it('Owner  can create DutchAuction crowdsale(scenario scenarioE2eDutchMincapLong.json), minCap,no whitelist',
		async function () {
			Investor1.tokenBalance = 0;
			let owner = Owner;
			assert.equal(await owner.setWalletAccount(), true, "Can not set Metamask account");
			let result = await owner.createDutchAuctionCrowdsale(e2eMinCap);
			return await assert.equal(result, true, 'Test FAILED. Crowdsale has not created ');
		});

	test.it("Contribution page: Countdown timer has correct status: 'TO START OF TIER1 '",
		async function () {
			let investor = Owner;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eMinCap), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let result = await investPage.isCrowdsaleNotStarted();
			return await assert.equal(result, true, 'Test FAILED. Countdown timer has incorrect status ');
		});

	test.it("Contribution page: Owner's balance has correct value (totalSupply-supply) ",
		async function () {
			balanceEthOwnerBefore = await Utils.getBalance(Owner);
			let owner = Owner;
			await owner.openContributionPage(e2eMinCap);
			let balance = await owner.getBalanceFromInvestPage(e2eMinCap);
			let shouldBe = e2eMinCap.totalSupply - e2eMinCap.tiers[0].supply;
			let result = (balance.toString() === shouldBe.toString());
			return await assert.equal(result, true, "Test FAILED. Owner's balance has incorrect value (totalSupply-supply)");
		});
	test.it("Contribution page: minContribution field contains correct minCap value ",
		async function () {
			let investor = Investor1;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eMinCap), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let result = await investPage.getMinContribution();
			return await assert.equal(result, e2eMinCap.tiers[0].minCap, 'Test FAILED. MinContribution value is incorrect ');
		});
	test.it('Manage page: owner is able to change minCap before start of crowdsale',
		async function () {
			let owner = Owner;
			let tierNumber = 1;
			assert.equal(await owner.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await owner.openManagePage(e2eMinCap), true, 'Owner can not open manage page');
			e2eMinCap.tiers[0].minCap = e2eMinCap.tiers[0].minCap / 2;
			let result = await owner.changeMinCapFromManagePage(tierNumber, e2eMinCap.tiers[0].minCap);
			return await assert.equal(result, true, 'Test FAILED.Owner is NOT able to add whitelisted address before start of crowdsale ');
		});

	test.it('Investor not able to buy before start of crowdsale ',
		async function () {
			let investor = Investor1;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eMinCap), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = e2eMinCap.tiers[0].minCap;
			let result = await investor.contribute(contribution);
			return await assert.equal(result, false, "Test FAILED. Whitelisted investor can buy before the crowdsale started");
		});

	test.it('Crowdsale starts as scheduled',
		async function () {

			let counter = 180;
			let startTime;
			do {
				startTime = await Utils.getDutchCrowdsaleStartTime(e2eMinCap);
				logger.info("wait " + Date.now());
				logger.info("wait " + startTime);
				//console.log("Date.now() = " + Date.now());
				//console.log("startTime =  " + startTime);
				//console.log("counter"+counter);
				await driver.sleep(1000);
			}
			while (counter-- > 0 && (Date.now() / 1000 <= startTime));
			return await assert.equal(counter > 0, true, 'Test FAILED. Tier has not start in time ');
		});

	test.it("Contribution page: Countdown timer has correct status: 'TO END OF TIER1 '",
		async function () {
			let investor = Owner;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eMinCap), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let result = await investPage.isCurrentTier1();
			return await assert.equal(result, true, 'Test FAILED. Countdown timer has incorrect status ');
		});
	test.it("Contribution page: minContribution field contains correct minCap value (after modifying)",
		async function () {
			let investor = Investor1;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eMinCap), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let result = await investPage.getMinContribution();
			//	console.log("minContr= "+ result );
			//	console.log("minCap= "+ e2eMinCap.tiers[0].minCap );
			//	console.log("equals= "+ result === e2eMinCap.tiers[0].minCap);
			//	await driver.sleep(30000);
			return await assert.equal(result, e2eMinCap.tiers[0].minCap, 'Test FAILED. MinContribution value is incorrect ');
		});
	test.it('Investor is not able to buy less than minCap in first transaction',
		async function () {
			let investor = Investor1;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eMinCap), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = e2eMinCap.tiers[0].minCap * 0.5;
			let result = await investor.contribute(contribution);
			return await assert.equal(result, false, "Test FAILED.Investor can buy less than minCap in first transaction");
		});

	test.it('Investor is able to buy amount equal minCap',
		async function () {
			let investor = Investor1;
			//assert.equal(await investor.setMetaMaskAccount(), true, "Can not set Metamask account");
			let contribution = e2eMinCap.tiers[0].minCap;
			investor.tokenBalance += contribution;
			let result = await investor.openContributionPage(e2eMinCap)
				&& await investor.contribute(contribution);
			return await assert.equal(result, true, 'Test FAILED. Investor can not buy ');
		});

	test.it('Contribution page: Investors balance is properly changed after purchase ',
		async function () {
			let investor = Investor1;
			await investor.openContributionPage(e2eMinCap);
			let newBalance = await investor.getBalanceFromInvestPage(e2eMinCap);
			let result = (Math.abs(parseFloat(newBalance) - parseFloat(investor.tokenBalance)) < 10);
			return await assert.equal(result, true, "Test FAILED. Investor can  buy but balance did not changed");
		});

	test.it('Investor is able to buy less than minCap after first transaction',
		async function () {
			let investor = Investor1;
			assert.equal(await investor.openContributionPage(e2eMinCap), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = e2eMinCap.tiers[0].minCap * 0.5;
			investor.tokenBalance += contribution;
			let result = await investor.contribute(contribution);
			return await assert.equal(result, true, "Test FAILED. Investor can NOT buy less than min after first transaction");

		});

	test.it('Manage page: owner is able to update minCap after start of crowdsale',
		async function () {
			let owner = Owner;
			let tierNumber = 1;
			assert.equal(await owner.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await owner.openManagePage(e2eMinCap), true, 'Owner can not open manage page');
			e2eMinCap.tiers[0].minCap = e2eMinCap.tiers[0].minCap * 2;
			let result = await owner.changeMinCapFromManagePage(tierNumber, e2eMinCap.tiers[0].minCap);
			return await assert.equal(result, true, 'Test FAILED.Manage page: owner is not able to update minCap after start of crowdsale ');
		});
	test.it("Contribution page: minContribution field contains correct minCap value (after modifying) ",
		async function () {
			let investor = Investor2;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eMinCap), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let result = await investPage.getMinContribution();
			return await assert.equal(result, e2eMinCap.tiers[0].minCap, 'Test FAILED. MinContribution value is incorrect ');
		});
	test.it('minCap should be updated: new investor is not able to buy less than new minCap ',
		async function () {
			let investor = Investor2;
			//assert.equal(await investor.setMetaMaskAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eMinCap), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = e2eMinCap.tiers[0].minCap - 1;
			let result = await investor.contribute(contribution);
			return await assert.equal(result, false, "Test FAILED. minCap wasn't updated");

		});
	test.it('minCap should be updated:  New investor is  able to buy amount equals  new minCap ',
		async function () {
			let investor = Investor2;
			assert.equal(await investor.openContributionPage(e2eMinCap), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = e2eMinCap.tiers[0].minCap;
			investor.tokenBalance = contribution;
			let result = await investor.contribute(contribution);
			return await assert.equal(result, true, "Test FAILED. Updated minCap in action: New investor is not able to buy amount equals  new minCap");
		});

	test.it('Old investor still able to buy amount less than minCap',
		async function () {
			let investor = Investor1;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eMinCap), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = e2eMinCap.tiers[0].minCap / 10;
			investor.tokenBalance += contribution;

			await investor.contribute(contribution);
			let balance = await investor.getBalanceFromInvestPage(e2eMinCap);
			let result = (Math.abs(parseFloat(balance) - parseFloat(investor.tokenBalance)) < 1);
			return await assert.equal(result, true, "Test FAILED.Investor can not  buy  maxCap");
		});

	test.it('Investor is able to buy maxCap',
		async function () {
			let investor = Investor1;
			assert.equal(await investor.openContributionPage(e2eMinCap), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let contribution = e2eMinCap.tiers[0].supply;
			investor.tokenBalance = contribution - Investor2.tokenBalance;
			await investor.contribute(contribution);
			let balance = await investor.getBalanceFromInvestPage(e2eMinCap);
			let result = (Math.abs(parseFloat(balance) - parseFloat(investor.tokenBalance)) < 0.1);
			return await assert.equal(result, true, "Test FAILED.Investor can not  buy  maxCap");
		});

	test.it("Owner's Eth balance properly changed ",
		async function () {
			balanceEthOwnerAfter = await Utils.getBalance(Owner);
			let contribution = e2eMinCap.tiers[0].supply;
			let delta = 0.1;
			let result = await Utils.compareBalance(balanceEthOwnerBefore, balanceEthOwnerAfter, contribution, e2eMinCap.tiers[0].minRate, delta);
			return await assert.equal(result, true, "Owner's balance incorrect");
		});

	test.it('Owner is able to finalize (if all tokens have been sold)',
		async function () {
			let owner = Owner;
			assert.equal(await owner.setWalletAccount(), true, "Can not set Metamask account");
			let result = await owner.finalize(e2eMinCap);
			return await assert.equal(result, true, "Test FAILED.'Owner can NOT finalize ");
		});

	test.it("Contribution page: Countdown timer has correct status: 'HAS BEEN FINALIZED '",
		async function () {
			let investor = Owner;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			assert.equal(await investor.openContributionPage(e2eMinCap), true, 'Investor can not open Invest page');
			assert.equal(await investPage.waitUntilLoaderGone(), true, 'Loader displayed too long time');
			let result = await investPage.isCrowdsaleFinalized();
			return await assert.equal(result, true, 'Test FAILED. Countdown timer has incorrect status ');
		});

	test.it('Investor #1 has received correct quantity of tokens after finalization',
		async function () {

			let investor = Investor1;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			await investor.openContributionPage(e2eMinCap);
			let shouldBe = parseFloat(await investor.getBalanceFromInvestPage(e2eMinCap));
			let balance = await investor.getTokenBalance(e2eMinCap) / 1e18;
			logger.info("Investor should receive  = " + shouldBe);
			logger.info("Investor has received balance = " + balance);
			logger.info("Difference = " + (balance - shouldBe));
			let result = (Math.abs(shouldBe - balance) < 1e-6);
			return await assert.equal(result, true, "Test FAILED.'Investor has received " + balance + " tokens instead " + shouldBe)

		});
	test.it('Investor #2 has received correct quantity of tokens after finalization',
		async function () {

			let investor = Investor2;
			assert.equal(await investor.setWalletAccount(), true, "Can not set Metamask account");
			await investor.openContributionPage(e2eMinCap);
			let shouldBe = parseFloat(await investor.getBalanceFromInvestPage(e2eMinCap));
			let balance = await investor.getTokenBalance(e2eMinCap) / 1e18;
			logger.info("Investor should receive  = " + shouldBe);
			logger.info("Investor has received balance = " + balance);
			logger.info("Difference = " + (balance - shouldBe));
			let result = (Math.abs(shouldBe - balance) < 1e-6);
			return await assert.equal(result, true, "Test FAILED.'Investor has received " + balance + " tokens instead " + shouldBe)

		});

	test.it('Owner has received correct quantity of tokens after finalization',
		async function () {

			let investor = Owner;
			let balance = await investor.getTokenBalance(e2eMinCap) / 1e18;
			let shouldBe = e2eMinCap.totalSupply - e2eMinCap.tiers[0].supply;
			logger.info("Investor should receive  = " + shouldBe);
			logger.info("Investor has received balance = " + balance);
			logger.info("Difference = " + (balance - shouldBe));
			let result = (Math.abs(shouldBe - balance) < 1e-6);
			return await assert.equal(result, true, "Test FAILED.'Investor has received " + balance + " tokens instead " + shouldBe)
		});

});
