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
const ContributionPage = require('../pages/ContributionPage.js').InvestPage;
const ManagePage = require('../pages/ManagePage.js').ManagePage;
const logger = require('../entity/Logger.js').logger;
const tempOutputPath = require('../entity/Logger.js').tempOutputPath;
const Utils = require('../utils/Utils.js').Utils;
const TEXT = require('../utils/constants.js').TEXT;
const TITLES = require('../utils/constants.js').TITLES;
const User = require("../entity/User.js").User;
const PublishPage = require('../pages/PublishPage.js').PublishPage;
const CrowdsaleList = require('../pages/CrowdsaleList.js').CrowdsaleList

test.describe(`e2e test for TokenWizard2.0/MintedCappedCrowdsale. v ${testVersion}`, async function () {
    this.timeout(2400000);//40 min
    this.slow(1800000);

    const user8545_56B2File = './users/user8545_56B2.json';//Owner
    const user77_F16AFile = './users/user77_F16A.json';//Investor1
    let driver;
    let Owner;
    let Investor1;

    let wallet;
    let welcomePage;
    let wizardStep1;
    let wizardStep2;
    let wizardStep3;
    let wizardStep4;
    let tierPage;
    let reservedTokensPage;
    let contributionPage;
    let crowdsalePage;
    let crowdsaleListPage

    let startURL;
    let crowdsaleForUItests;
    let managePage;
    let balanceEthOwnerBefore;
    let crowdsaleMintedSimple;
    let publishPage;
    let scenarioSimple

    const placeholder = {
        gasCustom: '0.1',
        setupNameTier1: 'Tier 1',
        setupNameTier2: 'Tier 2',
        decimals: '18',
        mincap: '0',
        contribute: '0'
    }

    const newValue = {
        tier1: {
            name: 'tier#1',
            rate: '456',
            supply: '1e6',
            mincap: '423',
            allowModify: true,
            enableWhitelist: false
        },
        tier2: {
            name: 'tier#2',
            rate: '789',
            supply: '1234',
            mincap: '13',
            allowModify: false,
            enableWhitelist: true
        },
        name: 'Name',
        decimals: '13',
        customGas: '100',
        ticker: 'Tick',
    }

    test.before(async function () {

        await Utils.copyEnvFromWizard();

        const scenarioForUItests = './scenarios/scenarioUItests.json';
        crowdsaleForUItests = await Utils.getMintedCrowdsaleInstance(scenarioForUItests);
        scenarioSimple = './scenarios/scenarioMintedSimple.json'
        crowdsaleMintedSimple = await Utils.getMintedCrowdsaleInstance(scenarioSimple);

        startURL = await Utils.getStartURL();
        driver = await Utils.startBrowserWithWallet();

        Owner = new User(driver, user8545_56B2File);
        await Utils.receiveEth(Owner, 20);
        Investor1 = new User(driver, user77_F16AFile);

        logger.info("Roles:");
        logger.info("Owner = " + Owner.account);
        balanceEthOwnerBefore = await Utils.getBalance(Owner);
        logger.info("Owner's balance = :" + balanceEthOwnerBefore / 1e18);

        wallet = await Utils.getWalletInstance(driver);
        //await wallet.activate();//return activated Wallet and empty page
        //await Owner.setWalletAccount();

        welcomePage = new WizardWelcome(driver, startURL);
        wizardStep1 = new WizardStep1(driver);
        wizardStep2 = new WizardStep2(driver);
        wizardStep3 = new WizardStep3(driver);
        wizardStep4 = new WizardStep4(driver);
        reservedTokensPage = new ReservedTokensPage(driver);
        managePage = new ManagePage(driver);
        tierPage = new TierPage(driver, crowdsaleForUItests.tiers[0]);
        contributionPage = new ContributionPage(driver);
        crowdsalePage = new CrowdsalePage(driver);
        publishPage = new PublishPage(driver)
        crowdsaleListPage = new CrowdsaleList(driver)

    });

    test.after(async function () {
        // Utils.killProcess(ganache);
        //await Utils.sendEmail(tempOutputFile);
        let outputPath = Utils.getOutputPath();
        outputPath = outputPath + "/result" + Utils.getDate();
        await fs.ensureDirSync(outputPath);
        await fs.copySync(tempOutputPath, outputPath);
        //await fs.remove(tempOutputPath);
        // await driver.quit();
    });
    describe("Welcome page, logged  out from wallet", async function () {

        test.it("User is able to open wizard welcome page",
            async function () {
                const result = await welcomePage.open()
                    && await welcomePage.waitUntilDisplayedButtonNewCrowdsale(180);
                return await assert.equal(result, true, "welcome page is not available ");
            });

        test.it("Warning present if user logged out from wallet",
            async function () {
                const result = await welcomePage.clickButtonNewCrowdsale()
                    && await welcomePage.waitUntilShowUpWarning(180)
                return await assert.equal(result, true, "no warning present if user logged out from wallet");
            });

        test.it("User can confirm warning",
            async function () {
                const result = await welcomePage.clickButtonOk()
                return await assert.equal(result, true, "button Ok doesn't present");
            });

        test.it("Return back to Home page opens if user confirm warning",
            async function () {
                const result = await welcomePage.waitUntilDisplayedButtonNewCrowdsale()
                return await assert.equal(result, true, "home page  isn't open");
            });

        test.it("No warning is displayed if user logged into wallet",
            async function () {
                const result = await wallet.activate() //return activated Wallet and empty page
                    && await Owner.setWalletAccount()
                    && await welcomePage.waitUntilShowUpWarning(10)
                return await assert.equal(result, false, "no warning present if user logged out from wallet ");
            });
    })
    describe ("Empty crowdsale list ", async function () {

        test.it("Crowdsale list opens if clicks button 'Choose contract'",
            async function () {
                const result = await welcomePage.clickButtonChooseContract()
                    && await crowdsaleListPage.waitUntilDisplayed(await crowdsaleListPage.getCrowdsaleList())
                    && await crowdsaleListPage.isElementDisplayed(await crowdsaleListPage.getCrowdsaleList())
                return await assert.equal(result, true, "crowdsale list isn't displayed");
            });

        test.it("Title is correct",
            async function () {
                await crowdsaleListPage.waitUntilDisplayedTitle(180)
                const result = await crowdsaleListPage.getTitleText();
                return await assert.equal(result, TITLES.CROWDSALE_LIST, "page's title is incorrect");
            });

        test.it ('Crowdsale list is empty',
            async function () {
                const result = await crowdsaleListPage.getNumberCrowdsales(15)
                return await assert.equal(result, 0, "crowdsale list contains unexpected address");
            });

        test.it ('Owner address is displayed and correct',
            async function () {
                const result = await crowdsaleListPage.getCrowdsaleListAddressOwner(15)
                return await assert.equal(result, Owner.account, "owner's address is incorrect");
            });

    })
    describe("Create crowdsale", async function () {

        test.it('User is able to create crowdsale(scenarioMintedSimple.json),2 tiers',
            async function () {
                const owner = Owner;
                assert.equal(await owner.setWalletAccount(), true, "Can not set Metamask account");
                const result = await owner.createMintedCappedCrowdsale({
                    crowdsale: crowdsaleMintedSimple,
                    stop: { publish: true }
                });

                return await assert.equal(result, true, 'Test FAILED. Crowdsale has not created ');
            });
    })
    describe("Publish page", async function () {
        describe('Common data', async function () {

            test.it("Title is correct",
                async function () {
                    await publishPage.waitUntilDisplayedTitle(180)
                    const result = await publishPage.getTitleText();
                    return await assert.equal(result, TITLES.PUBLISH_PAGE, "Page's title is incorrect");
                });
            test.it('Name is correct',
                async function () {
                    await driver.sleep(10000)
                    const result = await publishPage.getName()
                    return await assert.equal(crowdsaleMintedSimple.name, result, 'Publish page: name is incorrect ');
                });

            test.it('Ticker is correct',
                async function () {
                    const result = await publishPage.getTicker()
                    return await assert.equal(crowdsaleMintedSimple.ticker.toUpperCase(), result, 'Publish page: ticker is incorrect ');
                });

            test.it('Decimals is correct',
                async function () {
                    const result = await publishPage.getDecimals()
                    return await assert.equal(crowdsaleMintedSimple.decimals, result, 'Publish page: decimals is incorrect ');
                });

            test.it('Supply is correct',
                async function () {
                    const result = await publishPage.getSupply()
                    return await assert.equal(result, '0', 'Publish page: supply is incorrect ');
                });

            test.it('Wallet address is correct',
                async function () {
                    const result = await publishPage.getWalletAddress()
                    return await assert.equal(crowdsaleMintedSimple.walletAddress, result, 'Publish page: wallet address is incorrect ');
                });

            test.it('Crowdsale start time/date is correct',
                async function () {
                    const time = await publishPage.getCrowdsaleStartTime()
                    const startDate = crowdsaleMintedSimple.tiers[0].startDate
                    const startTime = crowdsaleMintedSimple.tiers[0].startTime
                    const date = await Utils.convertDateToUtc0(startDate, startTime)
                    const datePublish = await Utils.formatDate(date, 'publish')
                    console.log('inReal   ' + time)
                    console.log('shouldBe   ' + datePublish)
                    await assert.equal(time, datePublish, "crowdsale start time is incorrect")
                });

            test.it('Crowdsale end time/date is correct',
                async function () {
                    const time = await publishPage.getCrowdsaleEndTime()
                    const endDate = crowdsaleMintedSimple.tiers[1].endDate
                    const endTime = crowdsaleMintedSimple.tiers[1].endTime
                    const date = await Utils.convertDateToUtc0(endDate, endTime)
                    const datePublish = await Utils.formatDate(date, 'publish')
                    console.log('inReal   ' + time)
                    console.log('shouldBe   ' + datePublish)
                    await assert.equal(time, datePublish, "crowdsale end time is incorrect")
                });

            test.it('Compiler version is correct',
                async function () {
                    const result = await publishPage.getCompilerVersion()
                    return await assert.equal(result.includes('0.4.'), true, 'Publish page: compiler version is incorrect ');
                });

            test.it('Contract name is correct',
                async function () {
                    const result = await publishPage.getContractName()
                    return await assert.equal(result, 'MintedCappedProxy', 'Publish page: contract name is incorrect ');
                });

            test.it('Optimized flag is correct',
                async function () {
                    const result = await publishPage.getOptimized()
                    return await assert.equal(result, 'Yes', 'Publish page: optimized flag name is incorrect ');
                });

            test.it.skip('Contract source code is displayed and correct ',
                async function () {
                    const contract = await publishPage.getTextContract()
                    crowdsaleMintedSimple.sort = 'minted'
                    const shouldBe = await Utils.getContractSourceCode(crowdsaleMintedSimple)
                    return await assert.equal(contract, shouldBe, "contract source code isn't correct")
                })

            test.it('Encoded ABI is displayed and correct ',
                async function () {
                    const abi = await publishPage.getEncodedABI()
                    return await assert.equal(abi.length, 256, 'Publish page:encoded ABI isn\'t correct ');
                });
        })
        describe('Tier#1', async function () {
            test.it('Tier start time/date is correct',
                async function () {
                    const time = await publishPage.getTierStartTime(1)
                    const startDate = crowdsaleMintedSimple.tiers[0].startDate
                    const startTime = crowdsaleMintedSimple.tiers[0].startTime
                    const date = await Utils.convertDateToUtc0(startDate, startTime)
                    const datePublish = await Utils.formatDate(date, 'publish')
                    console.log('inReal   ' + time)
                    console.log('shouldBe   ' + datePublish)
                    await assert.equal(time, datePublish, "tier's start time is incorrect")
                });
            test.it('Tier end time/date is correct',
                async function () {
                    const time = await publishPage.getTierEndTime(1)
                    const endDate = crowdsaleMintedSimple.tiers[0].endDate
                    const endTime = crowdsaleMintedSimple.tiers[0].endTime
                    const date = await Utils.convertDateToUtc0(endDate, endTime)
                    const datePublish = await Utils.formatDate(date, 'publish')
                    console.log('inReal   ' + time)
                    console.log('shouldBe   ' + datePublish)
                    await assert.equal(time, datePublish, "tier's end time is incorrect")
                });
            test.it('Rate is correct',
                async function () {
                    const result = await publishPage.getRate(1)
                    return await assert.equal(crowdsaleMintedSimple.tiers[0].rate, result, 'Publish page: rate is incorrect ');
                });
            test.it('Allow modifying is correct',
                async function () {
                    const result = (await publishPage.getAllowModifying(1)) === 'Yes'
                    return await assert.equal(crowdsaleMintedSimple.tiers[0].allowModify, result, 'Publish page: allow modify is incorrect ');
                });
            test.it('Maxcap is correct',
                async function () {
                    const result = await publishPage.getMaxcap(1)
                    return await assert.equal(crowdsaleMintedSimple.tiers[0].supply, result, 'Publish page: maxcap is incorrect ');
                });
            test.it('Whitelisting is correct',
                async function () {
                    const result = (await publishPage.getWhitelisting(1)) === 'Yes'
                    return await assert.equal(crowdsaleMintedSimple.tiers[0].isWhitelisted, result, 'Publish page: whitelisting is incorrect ');
                });
            test.it('Mincap is correct',
                async function () {
                    const result = await publishPage.getMincap(1)
                    return await assert.equal('0', result, 'Publish page: mincap is incorrect ');
                });
        })
        describe('Tier#2', async function () {
            test.it('Tier start time/date is correct',
                async function () {
                    const time = await publishPage.getTierStartTime(2)
                    const startDate = crowdsaleMintedSimple.tiers[1].startDate
                    const startTime = crowdsaleMintedSimple.tiers[1].startTime
                    const date = await Utils.convertDateToUtc0(startDate, startTime)
                    const datePublish = await Utils.formatDate(date, 'publish')
                    console.log('inReal   ' + time)
                    console.log('shouldBe   ' + datePublish)
                    await assert.equal(time, datePublish, "tier's start time is incorrect")
                });

            test.it('Tier end time/date is correct',
                async function () {
                    const time = await publishPage.getTierEndTime(2)
                    const endDate = crowdsaleMintedSimple.tiers[1].endDate
                    const endTime = crowdsaleMintedSimple.tiers[1].endTime
                    const date = await Utils.convertDateToUtc0(endDate, endTime)
                    const datePublish = await Utils.formatDate(date, 'publish')
                    console.log('inReal   ' + time)
                    console.log('shouldBe   ' + datePublish)
                    await assert.equal(time, datePublish, "tier's end time is incorrect")
                });

            test.it('Rate is correct',
                async function () {
                    const result = await publishPage.getRate(2)
                    return await assert.equal(crowdsaleMintedSimple.tiers[1].rate, result, "rate is incorrect");
                });

            test.it('Allow modifying is correct',
                async function () {
                    const result = (await publishPage.getAllowModifying(2)) === 'No'
                    return await assert.equal(result, true, "allow modify is incorrect");
                });

            test.it('Maxcap is correct',
                async function () {
                    const result = await publishPage.getMaxcap(2)
                    return await assert.equal(crowdsaleMintedSimple.tiers[1].supply, result, "maxcap is incorrect");
                });

            test.it('Whitelisting is correct',
                async function () {
                    const result = (await publishPage.getWhitelisting(2)) === 'No'
                    return await assert.equal(result, true, "whitelisting is incorrect");
                });

            test.it('Mincap is correct',
                async function () {
                    const result = await publishPage.getMincap(2)
                    return await assert.equal(crowdsaleMintedSimple.tiers[1].minCap, result, "mincap is incorrect");
                });
        })
        describe("Check alerts, buttons", async function () {

            test.it("Warning displayed after refreshing",
                async function () {
                    const result = await publishPage.refresh()
                        && await Utils.delay(2000)
                        && await wizardStep4.isPresentAlert()
                        && await wizardStep4.acceptAlert()
                        && await publishPage.waitUntilShowUpWarning()
                        && await publishPage.clickButtonOk()
                    return await assert.equal(result, true, "warning does not present");
                });

            test.it("Button 'Download file' is presented and clickable, notice appears",
                async function () {
                    const result = !await publishPage.waitUntilShowUpWarning(15)
                    await publishPage.clickButtonDownload()
                    && await publishPage.waitUntilShowUpErrorNotice()
                    return await assert.equal(result, true, "button 'Download file' isn't present");
                });
            test.it("Clicking button 'Continue' opens Crowdsale page",
                async function () {
                    const result = await publishPage.clickButtonContinue()
                        && await publishPage.waitUntilLoaderGone()
                        && await crowdsalePage.waitUntilShowUpTitle()
                    return await assert.equal(result, true, "crowdsale page hasn't opened");
                });
        })
    })
    describe("Crowdsale page:", async function () {

        test.it("Title is correct",
            async function () {
                await Utils.delay(5000)
                await crowdsalePage.waitUntilDisplayedTitle(180)
                const result = await crowdsalePage.getTitleText();
                return await assert.equal(result, TITLES.CROWDSALE_PAGE, "Page's title is incorrect");
            });
        test.it("Proxy address is correct",
            async function () {
                const result = await crowdsalePage.getProxyAddress()
                crowdsaleMintedSimple.proxyAddress = result
                return await assert.equal(result.length, 42, "proxy address is incorrect");
            });
        test.it("Raised funds is correct",
            async function () {
                const result = await crowdsalePage.getRaisedFunds()
                return await assert.equal(result, '0 ETH', "raised funds is incorrect");
            });
        test.it("Goal funds is correct",
            async function () {
                const result = await crowdsalePage.getGoalFunds()
                const goal = crowdsaleMintedSimple.tiers[0].supply / crowdsaleMintedSimple.tiers[0].rate + crowdsaleMintedSimple.tiers[1].supply / crowdsaleMintedSimple.tiers[1].rate
                return await assert.equal(result.includes(goal.toString().slice(0, 15)), true, "goal funds is incorrect");
            });
        test.it("Tokens claimed is correct",
            async function () {
                const result = await crowdsalePage.getTokensClaimed()
                return await assert.equal(result, '0', "tokens claimed is incorrect")
            });
        test.it("Contributors number is correct",
            async function () {
                const result = await crowdsalePage.getContributors()
                return await assert.equal(result, '0', "contributors number is incorrect")
            });

        test.it("Rate is correct",
            async function () {
                const result = await crowdsalePage.getRate()
                return await assert.equal(result, crowdsaleMintedSimple.tiers[0].rate, "rate is incorrect")
            });

        test.it("Total supply is correct",
            async function () {
                const result = await crowdsalePage.getTotalSupply()
                const goal = crowdsaleMintedSimple.tiers[0].supply + crowdsaleMintedSimple.tiers[1].supply
                return await assert.equal(result, goal, "total supply is incorrect")
            });

        test.it("Should be alert if invalid proxyID in address bar",
            async function () {
                crowdsaleMintedSimple.url = await contributionPage.getURL()
                const wrongUrl = crowdsaleMintedSimple.url.substring(0, 50) + crowdsaleMintedSimple.url.substring(52, crowdsaleMintedSimple.length)
                const result = await contributionPage.open(wrongUrl)
                    && await contributionPage.waitUntilShowUpButtonOk()
                    && await contributionPage.clickButtonOk()
                    && await Utils.delay(5000)
                return await assert.equal(result, true, "no alert if invalid proxyID in address bar");
            });

        test.it("Clicking button 'Contribute' opens Contribution page",
            async function () {
                const result = await crowdsalePage.clickButtonContribute()
                    && await crowdsalePage.waitUntilLoaderGone()
                    && await contributionPage.waitUntilShowUpCountdownTimer()
                return await assert.equal(result, true, "contribution page hasn't opened");
            });
    })

    describe("Contribution page:", async function () {

        test.it("Title is correct",
            async function () {
                await Utils.delay(10000)
                await crowdsalePage.waitUntilDisplayedTitle(180)
                const result = await crowdsalePage.getTitleText();
                return await assert.equal(result, TITLES.CONTRIBUTE_PAGE, "Page's title is incorrect");
            });
        test.it("Current account is correct",
            async function () {
                const result = await contributionPage.getCurrentAccount()
                return await assert.equal(result, Owner.account, "current account isn't correct");
            });

        test.it("Proxy address is displayed and has correct length",
            async function () {
                const result = await contributionPage.getProxyAddress()
                return await assert.equal(result, crowdsaleMintedSimple.proxyAddress, "proxy address isn't correct");
            });

        test.it("Name is correct",
            async function () {
                const result = await contributionPage.getFieldsText('name')
                return await assert.equal(result, crowdsaleMintedSimple.name, "name isn't correct");
            });

        test.it("Ticker is correct",
            async function () {
                const result = await contributionPage.getFieldsText('ticker')
                return await assert.equal(crowdsaleMintedSimple.ticker.toUpperCase(), result, "ticker isn't correct");
            });
        test.it("Supply is correct",
            async function () {
                const result = await contributionPage.getFieldsText('supply')
                const shouldBe = crowdsaleMintedSimple.tiers[0].supply + crowdsaleMintedSimple.tiers[1].supply+' '+crowdsaleMintedSimple.ticker.toUpperCase()
                return await assert.equal(result, shouldBe, "total supply isn't correct");
            });

        test.it("Minimum contribution is correct",
            async function () {
                const result = await contributionPage.getFieldsText('minContribution')
                const shouldBe = 'You are not allowed'
                return await assert.equal(result, shouldBe, "minimum contribution isn't correct");
            });

        test.it("Maximum contribution is correct",
            async function () {
                const result = await contributionPage.getFieldsText('maxContribution')
                const shouldBe = 'You are not allowed'
                return await assert.equal(result, shouldBe, "maximum contribution isn't correct");
            });

        test.it("Balance is correct",
            async function () {
                const result = await contributionPage.getBalance()
                const shouldBe = '0 ' + crowdsaleMintedSimple.ticker.toUpperCase()
                return await assert.equal(result, shouldBe, "maximum contribution isn't correct");
            });

        test.it("Button 'Contribute' is disabled by default",
            async function () {
                const result = await contributionPage.isDisabledButtonContribute()
                return await assert.equal(result, true, "button 'Contribute' is enabled by default");
            });

        test.it.skip("Check error if incorrect contribution amount",
            async function () {
                await contributionPage.fillContribute('qwerty')
                const result = await contributionPage.getWarningText('contribute')
                console.log(result)
                const shouldBe = 'You are not allowed'
                await assert.notEqual(result, '', "error isn't displayed");
                return await assert.equal(result, shouldBe, "error's text isn't correct");
            });

        test.it("No error if contribution's amount is correct",
            async function () {
                await contributionPage.fillContribute('123')
                const result = await contributionPage.getWarningText('contribute')
                console.log(result)
                return await assert.equal(result, '', "unexpected error message");
            });

        test.it("Popup if contributes before start",
            async function () {
                const result = await contributionPage.clickButtonContribute()
                    && await contributionPage.waitUntilShowUpButtonOk()
                return await assert.equal(result, true, "no popup if contributes before start");
            });

        test.it("Popup has correct text",
            async function () {
                const text = await contributionPage.getTextPopup()
                console.log(text)
                const shouldBe = "Wait, please. Crowdsale company hasn't started yet. It'll start from Fri Feb 01 2030"
                console.log(shouldBe)
                await assert.equal(text.includes(shouldBe), true, "popup has incorrect text")
                const result = await contributionPage.clickButtonOk()
                return await assert.equal(result, true, "can't confirm popup");
            });

        test.it("Payment's option is displayed",
            async function () {
                const field = await contributionPage.getPaymentOption()
                await assert.notEqual(field, null, "payment's option isn't displayed")
            });

        test.it("Select QR option",
            async function () {
                const result = await contributionPage.clickQRoption()
                return await assert.equal(result, true, "payment's option isn't displayed")
            });

        test.it("QR: proxy address is correct",
            async function () {
                const result = await contributionPage.getQRaddress()
                console.log(result)
                console.log(crowdsaleMintedSimple.proxyAddress)
                await assert.equal(result, crowdsaleMintedSimple.proxyAddress, "QR: proxy address is incorrect")
            });

        test.it("QR: payment's data is correct",
            async function () {
                const result = await contributionPage.getQRdata()
                const shouldBe = '0x55f8650100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004a6f2ae3a00000000000000000000000000000000000000000000000000000000'
                await assert.equal(result, shouldBe, "QR:  payment's data is incorrect")
            });

        test.it("Select Wallet payment option",
            async function () {
                const result = await contributionPage.clickWalletOption()
                return await assert.equal(result, true, "payment's option isn't displayed")
            });


        test.it("Should be alert if invalid proxyID in address bar",
            async function () {
                crowdsaleMintedSimple.url = await contributionPage.getURL()
                const wrongUrl = crowdsaleMintedSimple.url.substring(0, 50) + crowdsaleMintedSimple.url.substring(52, crowdsaleMintedSimple.length)
                const result = await contributionPage.open(wrongUrl)
                    && await contributionPage.waitUntilShowUpButtonOk()
                    && await contributionPage.clickButtonOk()
                return await assert.equal(result, true, "no alert if invalid proxyID in address bar");
            });

        test.it.skip("Should be alert if invalid proxy address in address bar",
            async function () {
                const owner = Owner;
                crowdsaleMintedSimple.proxyAddress = await contributionPage.getProxyAddress()
                console.log(crowdsaleMintedSimple.proxyAddress)
                const wrongCrowdsale = crowdsaleMintedSimple;
                wrongCrowdsale.proxyAddress = crowdsaleMintedSimple.proxyAddress.substring(0, crowdsaleMintedSimple.proxyAddress.length - 5)
                const result = await owner.openCrowdsalePage(wrongCrowdsale)
                    && await contributionPage.waitUntilShowUpButtonOk()
                    && await contributionPage.clickButtonOk()
                return await assert.equal(result, true, "no alert if invalid proxyID in address bar");
            });


    })
    describe ("Not empty crowdsale list", async function () {

        test.it("User is able to open wizard welcome page",
            async function () {
                const result = await welcomePage.open()
                    && await welcomePage.waitUntilDisplayedButtonNewCrowdsale(180);
                return await assert.equal(result, true, "welcome page is not available ");
            });

        test.it("Crowdsale list opens if clicks button 'Choose contract'",
            async function () {
                const result = await welcomePage.clickButtonChooseContract()
                    && await crowdsaleListPage.waitUntilDisplayed(await crowdsaleListPage.getCrowdsaleList())
                    && await crowdsaleListPage.isElementDisplayed(await crowdsaleListPage.getCrowdsaleList())
                return await assert.equal(result, true, "crowdsale list isn't displayed");
            });

        test.it ('Crowdsale list contains 1 address',
            async function () {
                const result = await crowdsaleListPage.getNumberCrowdsales()
                return await assert.equal(result, 1, "crowdsale list is empty or contains more than 1 address");
            });

        test.it ("Proxy address is correct",
            async function () {
                const result = await crowdsaleListPage.getAddress(0)
                return await assert.equal(result.toUpperCase(), crowdsaleMintedSimple.proxyAddress.toUpperCase(), "crowdsale address is incorrect");
            });

        test.it("Button 'Continue' is displayed",
            async function () {
                const result = await crowdsaleListPage.isDisplayedButtonContinue()
                return await assert.equal(result, true, "button 'Continue' isn't displayed");
            });

        test.it ("Button 'Continue' is disabled if nothing has selected",
            async function () {
                const result = await crowdsaleListPage.isDisabledButtonContinue()
                return await assert.equal(result, true, "button 'Continue' enabled by default");
            });
        test.it("Select crowdsale",
            async function () {
                const result = await crowdsaleListPage.clickWithWait(await crowdsaleListPage.getRow(0))
                return await assert.equal(result, true, "can't click address");
            });
        test.it("Click button 'Continue'",
            async function () {
                const result = await crowdsaleListPage.clickButtonContinue()
                return await assert.equal(result, true, "can't click button 'Continue'");
            });
        test.it("Manage page opens by clicking button 'Continue'",
            async function () {
                await crowdsaleListPage.clickButtonContinue();
                await managePage.waitUntilDisplayedTitle(180);
                const result = await managePage.getTitleText();
                return await assert.equal(result, TITLES.MANAGE_PAGE, "page's title is incorrect");
            });
    })

    describe("Manage page", async function (){

        test.it("Title is correct",
            async function () {
                await Utils.delay(10000)
                await managePage.waitUntilDisplayedTitle(180)
                const result = await managePage.getTitleText();
                return await assert.equal(result, TITLES.MANAGE_PAGE, "Page's title is incorrect");
            });

    })

    describe("Welcome page", async function () {

        test.it("User is able to open wizard welcome page",
            async function () {
                const result = await welcomePage.open()
                    && await welcomePage.waitUntilDisplayedButtonNewCrowdsale(180);
                return await assert.equal(result, true, "welcome page is not available ");
            });
        test.it("Button 'Choose Contract' present",
            async function () {
                const result = await welcomePage.isDisplayedButtonChooseContract();
                return await assert.equal(result, true, "button 'Choose Contract' not present ");
            });

        test.it("Button 'New crowdsale' present",
            async function () {
                const result = await welcomePage.isDisplayedButtonNewCrowdsale();
                return await assert.equal(result, true, "button ' New crowdsale' is not present ");
            });

        test.it("Button 'Choose contract' present",
            async function () {
                const result = await welcomePage.isDisplayedButtonChooseContract();
                return await assert.equal(result, true, "button 'Choose contract' isn't presented ");
            });

        test.it("User is able to open Step1 by clicking button 'New crowdsale'",
            async function () {
                const result = await welcomePage.clickButtonNewCrowdsale()
                    && await wizardStep1.waitUntilDisplayedCheckboxWhitelistWithCap();
                return await assert.equal(result, true, "user is not able to activate Step1 by clicking button 'New crowdsale'");
            });
    })


    describe("Step#1:", async function () {

        test.it("Title is correct",
            async function () {
                await wizardStep1.waitUntilDisplayedTitle(180)
                const result = await wizardStep1.getTitleText();
                return await assert.equal(result, TITLES.STEP1, "Page's title is incorrect");
            });

        test.it.skip("Move back/forward - page keep state of checkbox 'Whitelist with mincap'",
            async function () {
                const result = await wizardStep1.clickCheckboxWhitelistWithCap()
                    && await wizardStep1.goBack()
                    && await wizardStep1.waitUntilLoaderGone()
                    && await Utils.delay(2000)
                    && await welcomePage.isDisplayedButtonChooseContract()
                    && await wizardStep1.goForward()
                    && await wizardStep1.waitUntilLoaderGone()
                    && await wizardStep1.waitUntilDisplayedCheckboxWhitelistWithCap()
                    && await wizardStep1.isSelectedCheckboxWhitelistWithCap()
                return await assert.equal(result, true, "Checkbox 'Whitelist with mincap' was changed after move back/forward");
            });

        test.it("Alert if user is going to leave TW",
            async function () {
                const result = await wizardStep1.clickCheckboxDutchAuction()
                    && await wizardStep1.clickCheckboxWhitelistWithCap()
                    && (!await wizardStep1.open('localhost:3000/?uiversion=2'))
                    && await wizardStep1.isPresentAlert()
                    && await wizardStep1.cancelAlert()
                    && await wizardStep1.waitUntilDisappearAlert()
                return await assert.equal(result, true, "alert does not present if user wants to leave TW");
            });

        test.it("Alert is displayed if reload the page",
            async function () {
                const result = await wizardStep1.clickCheckboxWhitelistWithCap()
                    && await wizardStep1.refresh()
                    && await Utils.delay(2000)
                    && await wizardStep1.isPresentAlert()
                    && await wizardStep1.acceptAlert()
                return await assert.equal(result, true, "alert does not present");
            });
        test.it("Refresh - page keep state of checkbox 'Whitelist with mincap'",
            async function () {
                const result = await wizardStep1.waitUntilLoaderGone()
                    && await wizardStep1.isSelectedCheckboxWhitelistWithCap()
                return await assert.equal(result, true, "Checkbox 'Whitelist with mincap' was changed after refresh");
            });

        test.it("Change network - page keep state of checkbox 'Whitelist with mincap'",
            async function () {
                const result = await wizardStep1.clickCheckboxWhitelistWithCap()
                    && await Investor1.setWalletAccount()
                    && (await wizardStep1.isPresentAlert() ? await wizardStep1.cancelAlert() : true)
                    && await wizardStep1.waitUntilLoaderGone()
                    && await Utils.delay(2000)
                    && await wizardStep1.waitUntilDisplayedCheckboxWhitelistWithCap()
                    && await wizardStep1.isSelectedCheckboxWhitelistWithCap()
                    && await Owner.setWalletAccount()
                    && await wizardStep1.waitUntilLoaderGone()
                return await assert.equal(result, true, "Checkbox 'Whitelist with mincap' was changed after change network");
            });

        test.it("User is able to open Step2 by clicking button Continue",
            async function () {
                let count = 10;
                do {
                    await driver.sleep(1000);
                    if ( (await wizardStep1.isDisplayedButtonContinue()) &&
                        !(await wizardStep2.isDisplayedFieldName()) ) {
                        await wizardStep1.clickButtonContinue();
                    }
                    else break;
                }
                while ( count-- > 0 );
                let result = await wizardStep2.isDisplayedFieldName();
                return await assert.equal(result, true, "user is not able to open Step2 by clicking button 'Continue'");
            });
    })

    describe("Step#2:", async function () {
        const invalidValues = {
            name: '012345678901234567790123456789f',
            ticker: 'qwe$#',
            decimals: '19',
            address: 'lsdnfoiwd',
            value: '0.00000123134824956234651234234'
        }

        test.it("Title is correct",
            async function () {
                await wizardStep2.waitUntilDisplayedTitle(180)
                const result = await wizardStep2.getTitleText();
                return await assert.equal(result, TITLES.STEP2, "Page's title is incorrect");
            });

        test.it("Button 'Back' opens Step#1",
            async function () {
                const result = await wizardStep2.clickButtonBack()
                    && await wizardStep1.waitUntilDisplayedCheckboxDutchAuction()
                await assert.equal(result, true, "Incorrect behavior of button 'Back'")
            })

        test.it("User is able to open Step2 by clicking button 'Continue'",
            async function () {
                await wizardStep1.clickCheckboxWhitelistWithCap()
                let count = 10;
                do {
                    await driver.sleep(1000);
                    if ( (await wizardStep1.isDisplayedButtonContinue()) &&
                        !(await wizardStep2.isDisplayedFieldName()) ) {
                        await wizardStep1.clickButtonContinue();
                    }
                    else break;
                }
                while ( count-- > 0 );
                let result = await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.isDisplayedFieldName();
                return await assert.equal(result, true, "user is not able to open Step2 by clicking button 'Continue'");
            });

        test.it("Alert if user is going to leave TW",
            async function () {
                const result = (!await wizardStep2.open('localhost:3000/?uiversion=2'))
                    && await wizardStep2.isPresentAlert()
                    && await wizardStep2.cancelAlert()
                    && await wizardStep2.waitUntilDisappearAlert()
                return await assert.equal(result, true, "alert does not present if user wants to leave TW");
            });

        test.it("Error message if name longer than 30 symbols",
            async function () {
                const result = await wizardStep2.fillName(invalidValues.name)
                    && await wizardStep2.getWarningText('name')
                return await assert.equal(result, "Please enter a valid name between 1-30 characters", "Incorrect error message");
            });

        test.it("Button 'Continue' disabled if name is wrong",
            async function () {
                const result = await wizardStep2.isDisabledButtonContinue()
                return await assert.equal(result, true, "button 'Continue' is enabled if error message");
            });

        test.it("Error message if field 'Name' is empty",
            async function () {

                const result = await wizardStep2.fillName('')
                    && await wizardStep2.getWarningText('name')
                return await assert.equal(result, 'This field is required', "Incorrect error message");
            });

        test.it("User able to fill out field 'Name' with valid data",
            async function () {
                const result = await wizardStep2.fillName(newValue.name)
                return await assert.equal(result, true, "field 'Name' was changed");
            });

        test.it.skip("Move back/forward - page keep state of field 'Name'",
            async function () {
                const result = await wizardStep2.goBack()
                    && await wizardStep1.waitUntilDisplayedCheckboxWhitelistWithCap()
                    && await wizardStep1.goForward()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.waitUntilDisplayedFieldName()
                    && await wizardStep2.waitUntilHasValueFieldName();
                await assert.equal(result, true, "field 'Name' was changed");
                return await assert.equal(await wizardStep2.getValueFieldName(), newValue.name, "field 'Name' was changed");
            });

        test.it("Alert is displayed if reload the page",
            async function () {
                const result = await wizardStep2.refresh()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await Utils.delay(2000)
                    && await wizardStep2.isPresentAlert()
                    && await wizardStep2.acceptAlert()
                return await assert.equal(result, true, "alert does not present");
            });

        test.it("Reload - page keep state of  field 'Name'",
            async function () {
                const result = await wizardStep2.waitUntilDisplayedFieldName()
                    && await wizardStep2.waitUntilHasValueFieldName();
                await assert.equal(result, true, "field 'Name' was changed");
                return await assert.equal(await wizardStep2.getValueFieldName(), newValue.name, "field 'Name' was changed");
            });

        test.it("Change network - page keep state of  field 'Name'",
            async function () {
                const result = await Investor1.setWalletAccount()
                    && (await wizardStep1.isPresentAlert() ? await wizardStep1.cancelAlert() : true)
                    && await wizardStep2.waitUntilLoaderGone()
                    && await Utils.delay(2000)
                    && await wizardStep2.waitUntilHasValueFieldName()
                    && (await wizardStep2.getValueFieldName() === newValue.name)
                    && await Owner.setWalletAccount()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.waitUntilHasValueFieldName()
                    && (await wizardStep2.getValueFieldName() === newValue.name)
                return await assert.equal(result, true, "field 'Name' was changed");
            });

        test.it('Error message if ticker longer than 5 symbols',
            async function () {
                await wizardStep2.fillTicker(invalidValues.name)
                await Utils.delay(2000)
                const result = await wizardStep2.getWarningText('ticker')
                return await assert.equal(result, "Please enter a valid ticker between 1-5 characters", "Incorrect error message");
            });

        test.it("Error message if ticker contains special symbols",
            async function () {
                await wizardStep2.fillTicker(invalidValues.ticker)
                await Utils.delay(2000)
                const result = await wizardStep2.getWarningText('ticker')
                return await assert.equal(result, 'Only alphanumeric characters', 'Incorrect error message');
            });

        test.it("Error message if field 'Ticker' is empty",
            async function () {
                const result = await wizardStep2.fillTicker('')
                    && await wizardStep2.refresh()
                    && await Utils.delay(2000)
                    && (await wizardStep2.isPresentAlert() ? await wizardStep2.acceptAlert() : true)
                    && await wizardStep2.waitUntilDisappearAlert()
                    && await wizardStep2.getWarningText('ticker')
                return await assert.equal(result, "This field is required", "Incorrect error message");
            });

        test.it("User able to fill out field 'Ticker' with valid data",
            async function () {
                await wizardStep2.fillTicker(newValue.ticker)
                await Utils.delay(1000)
                const result = await wizardStep2.isDisplayedWarningTicker()
                return await assert.equal(result, false, "user is not  able to fill out field 'Ticker' with valid data");
            });

        test.it("Field 'Decimals' has placeholder 18",
            async function () {
                return await assert.equal(await wizardStep2.getValueFieldDecimals(), placeholder.decimals, "field 'Decimals' has incorrect placeholder");
            });

        test.it("Error message if decimals more than 18",
            async function () {
                await wizardStep2.fillDecimals(invalidValues.decimals)
                const result = await wizardStep2.getWarningText('decimals')
                return await assert.equal(result, 'Should not be greater than 18', "Incorrect error message");
            });

        test.it("Error message if field 'Decimals' is empty",
            async function () {
                await wizardStep2.fillDecimals('')
                const result = await wizardStep2.getWarningText('decimals')
                return await assert.equal(result, 'This field is required', "Incorrect error message");
            });

        test.it("User able to fill out field 'Decimals' with valid data",
            async function () {
                let result = await wizardStep2.fillDecimals(newValue.decimals);
                return await assert.equal(result, true, "user is not able to fill field 'Decimals' with valid data ");
            });

        test.it("Error message if invalid reserved address",
            async function () {
                await reservedTokensPage.fillAddress(invalidValues.address)
                const result = await reservedTokensPage.getWarningText('address')
                return await assert.equal(result, 'The inserted address is invalid', "Incorrect error message");
            });

        test.it("Error message if value exceed decimals specified",
            async function () {
                await reservedTokensPage.fillValue(invalidValues.value)
                const result = await reservedTokensPage.getWarningText('value')
                return await assert.equal(result, 'Value must be positive and decimals should not exceed the amount of decimals specified', "Incorrect error message");
            });

        test.it("User is able to download *.csv file with reserved tokens",
            async function () {
                const fileName = './public/reservedAddressesTestValidation.csv'
                const result = await reservedTokensPage.uploadReservedCSVFile(fileName)
                    && await reservedTokensPage.waitUntilShowUpWarning(20)
                return await assert.equal(result, true, "user isn't able to download CVS file with whitelisted addresses");
            })

        test.it("Check validator for *.csv files with reserved addresses",
            async function () {
                const text = await tierPage.getTextPopup()
                return await assert.equal(text, TEXT.RESERVED_VALIDATOR, "validator's message is incorrect")
            });

        test.it("Number of added reserved addresses is zero",
            async function () {
                await reservedTokensPage.clickButtonOk()
                const shouldBe = 0
                const result = await reservedTokensPage.amountAddedReservedTokens()
                return await assert.equal(result, shouldBe, "number of added reserved tokens is correct")
            });

        test.it("User is able to download CSV file with reserved tokens",
            async function () {
                const fileName = './public/reservedAddresses21.csv';
                const result = await reservedTokensPage.uploadReservedCSVFile(fileName);
                return await assert.equal(result, true, "user isn't able to download CVS file with whitelisted addresses")
            });

        test.it("Popup window is displayed if number of whitelisted reserved greater than 20",
            async function () {
                const result = await reservedTokensPage.waitUntilShowUpPopupConfirm(100)
                return await assert.equal(result, true, "no popup if number of reserved addresses greater than 20");
            });

        test.it("Popup has correct text",
            async function () {
                const text = await tierPage.getTextPopup()
                await assert.equal(text, TEXT.RESERVED_MAX_REACHED, "popup's text is  incorrect")
            });

        test.it("Confirm popup",
            async function () {
                const result = await wizardStep3.clickButtonOk();
                return await assert.equal(result, true, "button 'Ok' doesn't present")
            });

        test.it("Added only 20 reserved addresses from CSV file",
            async function () {
                const correctNumberReservedTokens = 20;
                const result = await reservedTokensPage.amountAddedReservedTokens();
                return await assert.equal(result, correctNumberReservedTokens, "number of added reserved tokens is correct");
            });

        test.it("Button 'Clear all' is displayed",
            async function () {
                const result = await reservedTokensPage.isLocatedButtonClearAll();
                return await assert.equal(result, true, "button 'Clear all' isn't displayed");
            });

        test.it("Alert present if clicks button 'Clear all'",
            async function () {
                const result = await reservedTokensPage.clickButtonClearAll()
                    && await reservedTokensPage.waitUntilShowUpWarning()
                    && await reservedTokensPage.isDisplayedButtonNoAlert();
                return await assert.equal(result, true, "alert isn't displayed");
            });

        test.it("User is able to bulk delete all reserved tokens",
            async function () {
                const result = await reservedTokensPage.waitUntilShowUpPopupConfirm(20)
                    && await reservedTokensPage.clickButtonYesAlert()
                    && await reservedTokensPage.amountAddedReservedTokens();
                return await assert.equal(result, 0, "user isn't able bulk delete all reserved tokens");
            });

        test.it("User is able to add reserved tokens",
            async function () {
                const result = await reservedTokensPage.refresh()//for prevent ElementNotVisibleError
                    && (await reservedTokensPage.isPresentAlert() ? await reservedTokensPage.acceptAlert() : true)
                    && await reservedTokensPage.waitUntilDisappearAlert()
                    && await reservedTokensPage.waitUntilLoaderGone()
                    && await reservedTokensPage.fillReservedTokens(crowdsaleForUItests)
                    && await reservedTokensPage.amountAddedReservedTokens()
                return await assert.equal(result, crowdsaleForUItests.reservedTokens.length, "user isn't able to add reserved tokens");
            });

        test.it("Field 'Decimals' is disabled if reserved tokens are added",
            async function () {
                const result = await wizardStep2.isDisabledDecimals();
                return await assert.equal(result, true, "field 'Decimals' enabled if reserved tokens added ");
            });

        test.it("User is able to remove one of reserved tokens",
            async function () {
                await reservedTokensPage.refresh()//for prevent ElementNotVisibleError
                if ( await reservedTokensPage.isPresentAlert() ) await reservedTokensPage.cancelAlert()
                await reservedTokensPage.waitUntilDisappearAlert()
                let amountBefore = await reservedTokensPage.amountAddedReservedTokens();
                await reservedTokensPage.removeReservedTokens(1);
                let amountAfter = await reservedTokensPage.amountAddedReservedTokens();
                return await assert.equal(amountBefore - 1, amountAfter, "User is not able to remove reserved tokens");
            });

        test.it.skip("Move back/forward - page keep state of each field",
            async function () {
                const result = await wizardStep2.goBack()
                    && await wizardStep1.waitUntilDisplayedCheckboxWhitelistWithCap()
                    && await wizardStep1.goForward()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.waitUntilHasValueFieldName();
                await assert.equal(result, true, "page isn't loaded");
                await assert.equal(await wizardStep2.getValueFieldName(), newValue.name, "field 'Name' changed");
                await assert.equal(await wizardStep2.getValueFieldDecimals(), newValue.decimals, "field 'Decimals' changed");
                await assert.equal(await wizardStep2.getValueFieldTicker(), newValue.ticker, "field 'Ticker' changed");
                await assert.equal(await reservedTokensPage.amountAddedReservedTokens(), crowdsaleForUItests.reservedTokens.length - 1, "reserved tokens changed");
            });

        test.it("Alert is displayed if reload the page",
            async function () {
                const result = await wizardStep2.refresh()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await Utils.delay(2000)
                    && await wizardStep2.isPresentAlert()
                    && await wizardStep2.acceptAlert()
                return await assert.equal(result, true, "alert does not present");
            });


        test.it("Reload - page keep state of each field",
            async function () {
                const result = await wizardStep2.waitUntilDisplayedFieldName()
                    && await wizardStep2.waitUntilHasValueFieldName();
                await assert.equal(result, true, "page isn't loaded");
                await assert.equal(await wizardStep2.getValueFieldName(), newValue.name, "field 'Name' changed");
                await assert.equal(await wizardStep2.getValueFieldDecimals(), newValue.decimals, "field 'Decimals' changed");
                await assert.equal(await wizardStep2.getValueFieldTicker(), newValue.ticker, "field 'Ticker' changed");
                await assert.equal(await reservedTokensPage.amountAddedReservedTokens(), crowdsaleForUItests.reservedTokens.length - 1, "reserved tokens changed");
            });

        test.it("Change network - page keep state of each field",
            async function () {
                let result = await Investor1.setWalletAccount()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.waitUntilHasValueFieldName()
                    && await Utils.delay(2000)
                await assert.equal(result, true, "page isn't loaded");
                await assert.equal(await wizardStep2.getValueFieldName(), newValue.name, "field 'Name' changed");
                await assert.equal(await wizardStep2.getValueFieldDecimals(), newValue.decimals, "field 'Decimals' changed");
                await assert.equal(await wizardStep2.getValueFieldTicker(), newValue.ticker, "field 'Ticker' changed");
                await assert.equal(await reservedTokensPage.amountAddedReservedTokens(), crowdsaleForUItests.reservedTokens.length - 1, "reserved tokens changed");

                result = await Owner.setWalletAccount()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.waitUntilHasValueFieldName()
                    && await Utils.delay(2000)
                await assert.equal(result, true, "page isn't loaded");
                await assert.equal(await wizardStep2.getValueFieldName(), newValue.name, "field 'Name' changed");
                await assert.equal(await wizardStep2.getValueFieldDecimals(), newValue.decimals, "field 'Decimals' changed");
                await assert.equal(await wizardStep2.getValueFieldTicker(), newValue.ticker, "field 'Ticker' changed");
                await assert.equal(await reservedTokensPage.amountAddedReservedTokens(), crowdsaleForUItests.reservedTokens.length - 1, "reserved tokens changed");

            });

        test.it("Button 'Continue' is displayed",
            async function () {
                const result = await wizardStep2.isDisplayedButtonContinue();
                return await assert.equal(result, true, "button 'Continue' isn't present");
            });

        test.it("User is able to open Step3 by clicking button 'Continue'",
            async function () {
                await wizardStep2.clickButtonContinue();
                await wizardStep3.waitUntilDisplayedTitle(180);
                const result = await wizardStep3.getTitleText();
                return await assert.equal(result, TITLES.STEP3, "Page's title is incorrect");
            });
    })
    describe("Step#3: ", async function () {
        const invalidValues = {

            walletAddress: '0x56B2e3C3cFf7f3921D2e0F8B8e20d1eEc2926b'
        }
        describe('Crowdsale data', async function () {

            test.it("Title is correct",
                async function () {
                    await wizardStep3.waitUntilDisplayedTitle(180)
                    const result = await wizardStep3.getTitleText();
                    return await assert.equal(result, TITLES.STEP3, "Page's title is incorrect");
                });

            test.it("Alert if user is going to leave TW",
                async function () {
                    const result = (!await wizardStep3.open('localhost:3000/?uiversion=2'))
                        && await wizardStep3.isPresentAlert()
                        && await wizardStep3.cancelAlert()
                        && await wizardStep3.waitUntilDisappearAlert()
                    return await assert.equal(result, true, "alert does not present if user wants to leave TW");
                });

            test.it("Button 'Continue' is disabled if data are wrong",
                async function () {
                    let result = await wizardStep3.isDisabledButtonContinue();
                    return await assert.equal(result, true, "Button 'Continue' is enabled");
                });

            test.it('Field Wallet address contains current metamask account address  ',
                async function () {
                    let result = await wizardStep3.getValueFieldWalletAddress();
                    result = (result === Owner.account.toString());
                    return await assert.equal(result, true, "Test FAILED. Wallet address does not match the metamask account address ");
                });

            test.it('Error message if wallet address is incorrect',
                async function () {
                    let result = await wizardStep3.fillWalletAddress(invalidValues.walletAddress)
                        && await wizardStep3.waitUntilHasValue('walletAddress')
                    await assert.equal(result, true, 'Cannot fill out the field');
                    result = await wizardStep3.getWarningText('walletAddress')
                    await assert.equal(result, 'Please enter a valid address', 'Incorrect error message');
                    await wizardStep3.fillWalletAddress(Owner.account.toString());
                });

            test.it('Checkbox gasprice \'Safe\' by default ',
                async function () {
                    const result = await wizardStep3.isSelectedCheckboxGasSafe()
                        && !await wizardStep3.isSelectedCheckboxGasNormal()
                        && !await wizardStep3.isSelectedCheckboxGasFast()
                        && !await wizardStep3.isSelectedCheckboxGasCustom()
                        && !await wizardStep3.isDisplayedFieldGasCustom()
                    return await assert.equal(result, true, "Wizard step#3: checkbox gasprice 'Safe'  by default ");
                });

            test.it('User is able to set checkbox gasprice \'Normal\'',
                async function () {
                    const result = await wizardStep3.clickCheckboxGasNormal()
                        && await wizardStep3.isSelectedCheckboxGasNormal()
                    return await assert.equal(result, true, "Wizard step#3: checkbox gasprice 'Normal' isn\'t selected ");
                });

            test.it('User is able to set checkbox gasprice \'Safe\'',
                async function () {
                    const result = await wizardStep3.clickCheckboxGasSafe()
                        && await wizardStep3.isSelectedCheckboxGasSafe()
                    return await assert.equal(result, true, "Wizard step#3: checkbox gasprice 'Safe' isn\'t selected ");
                });

            test.it('Field \'Gas price custom\' isn\'t displayed if checkbox gasprice \'Custom\' isn\'t selected ',
                async function () {
                    const result = await wizardStep3.isDisplayedFieldGasCustom()
                    return await assert.equal(result, false, "Wizard step#3: checkbox gasprice 'Custom' isn\'t selected ");
                });

            test.it('User is able to set checkbox gasprice \'Fast\'',
                async function () {
                    const result = await wizardStep3.clickCheckboxGasFast()
                        && await wizardStep3.isSelectedCheckboxGasFast()
                    return await assert.equal(result, true, "Wizard step#3: checkbox gasprice 'Fast' isn\'t selected ");
                });

            test.it('User is able to set "Custom Gasprice" checkbox',
                async function () {
                    const result = await wizardStep3.clickCheckboxGasCustom()
                        && await wizardStep3.isSelectedCheckboxGasCustom()
                    return await assert.equal(result, true, "Wizard step#3: checkbox gasprice 'Custom' isn\'t selected ");
                });

            test.it('Field \'Gas price custom\' displayed if checkbox gasprice \'Custom\'is selected ',
                async function () {
                    const result = await wizardStep3.isDisplayedFieldGasCustom()
                    return await assert.equal(result, true, "Wizard step#3: checkbox gasprice 'Custom' isn\'t selected ");
                });

            test.it('Field \'Gas price custom\' has correct placeholder ',
                async function () {
                    const result = await wizardStep3.getValueFieldGasCustom()
                    return await assert.equal(result, placeholder.gasCustom, "Wizard step#3: checkbox gasprice 'Custom' isn\'t selected ");
                });

            test.it("Error message if Field 'Gas price custom' is empty",
                async function () {
                    let result = await wizardStep3.fillGasPriceCustom(' ')
                        && await wizardStep3.waitUntilHasValue('gasPrice')
                        && await Utils.delay(2000)
                    await assert.equal(result, true, 'Cannot fill out the field');
                    result = await wizardStep3.getWarningText('gasPrice')
                    await assert.equal(result, 'Should be greater or equal than 0.1', 'Incorrect error message');
                });

            test.it('User is able to fill out the CustomGasprice field with valid value',
                async function () {
                    const result = await wizardStep3.fillGasPriceCustom(newValue.customGas);
                    return await assert.equal(result, true, 'Test FAILED. Wizard step#3: User is NOT able to fill "Custom Gasprice" with valid value');
                });

            test.it('no error message if CustomGasprice field has valid value',
                async function () {
                    const result = await wizardStep3.getWarningText('gasPrice')
                    await assert.equal(result, '', 'Unexpected error message');
                });
        })
        describe('Tier#1: ', async function () {
            const invalidValues = {
                nameLong: 'qertyuiopasdfghjklzxcvbnmqwertyui'
            }
            test.it('Field \'Mincap\' has placeholder 0 ',
                async function () {
                    const result = await tierPage.getValueFieldMinCap();
                    return await assert.equal(result, placeholder.mincap, "Tier#1: field 'Mincap' has incorrect value by default ");
                });

            test.it('Error message if field \'Mincap\' is empty',
                async function () {
                    const tier = tierPage
                    tier.tier.minCap = ' '
                    let result = await tier.fillMinCap(1)
                        && await Utils.delay(2000)
                    await assert.equal(result, true, 'Cannot fill out the field');
                    result = await tier.getWarningText('minCap')
                    await assert.equal(result, 'Please enter a valid number greater or equal than 0', 'Incorrect error message');
                });

            test.it('Field \'Setup name\' has correct placeholder',
                async function () {
                    const result = await tierPage.getValueFieldSetupName();
                    return await assert.equal(result, placeholder.setupNameTier1, "Tier#1: field 'Setup name' has incorrect placeholder ");
                });

            test.it('Error message if field \'Setup name\' is empty',
                async function () {
                    const tier = tierPage
                    tier.tier.name = ''
                    let result = await tier.fillSetupName()
                        && await Utils.delay(2000)
                    await assert.equal(result, true, 'Cannot fill out the field');
                    result = await tier.getWarningText('name')
                    await assert.equal(result, 'This field is required', 'Incorrect error message');
                });

            test.it('Error message if name too long',
                async function () {
                    const tier = tierPage
                    tier.tier.name = invalidValues.nameLong
                    let result = await tier.fillSetupName()
                        && await tier.waitUntilHasValue('name')
                        && await Utils.delay(2000)
                    await assert.equal(result, true, 'Cannot fill out the field');
                    result = await tier.getWarningText('name')
                    await assert.equal(result, 'Please enter a valid name between 1-30 characters', 'Incorrect error message');
                });

            test.it('Error message if rate is negative',
                async function () {
                    const tier = tierPage
                    tier.tier.rate = '-1'
                    let result = await tier.fillRate()
                        && await tier.waitUntilHasValue('rate')
                        && await Utils.delay(2000)
                    await assert.equal(result, true, 'Cannot fill out the field');
                    result = await tier.getWarningText('rate')
                    await assert.equal(result, 'Please enter a valid number greater than 0', 'Incorrect error message');
                });

            test.it("Error messages if field 'Rate' is empty",
                async function () {
                    const tier = tierPage
                    tier.tier.rate = ''
                    let result = await tier.fillRate()
                        && await Utils.delay(2000)
                    await assert.equal(result, true, 'Cannot fill out the field');
                    result = await tier.getWarningText('rate')
                    await assert.equal(result.includes('Please enter a valid number greater than 0'), true, 'Incorrect error message');
                    await assert.equal(result.includes('Should be integer'), true, 'Incorrect error message');
                    await assert.equal(result.includes('Should not be greater than 1 quintillion (10^18)'), true, 'Incorrect error message');
                });

            test.it('Error messages if rate is not integer',
                async function () {
                    const tier = tierPage
                    tier.tier.rate = '1.2345'
                    let result = await tier.fillRate()
                        && await tier.waitUntilHasValue('rate')
                        && await Utils.delay(2000)
                    await assert.equal(result, true, 'Cannot fill out the field');
                    result = await tier.getWarningText('rate')
                    await assert.equal(result, 'Should be integer', true, 'Incorrect error message');
                });

            test.it('Error messages if rate is greater than 1e18',
                async function () {
                    const tier = tierPage
                    tier.tier.rate = '1e19'
                    let result = await tier.fillRate()
                        && await tier.waitUntilHasValue('rate')
                        && await Utils.delay(2000)
                    await assert.equal(result, true, 'Cannot fill out the field');
                    result = await tier.getWarningText('rate')
                    await assert.equal(result, 'Should not be greater than 1 quintillion (10^18)', true, 'Incorrect error message');
                });
            test.it("User is able to fill out field 'Rate' with valid data",
                async function () {
                    tierPage.number = 0;
                    tierPage.tier.rate = newValue.tier1.rate;
                    const result = await tierPage.fillRate();
                    return await assert.equal(result, true, "User isn't able to fill out field 'Rate' with valid data");
                });

            test.it("Error message if field 'Supply' is empty",
                async function () {
                    const tier = tierPage
                    tier.tier.supply = '-1'
                    let result = await tier.fillSupply()
                        && await Utils.delay(2000)
                    await assert.equal(result, true, 'Cannot fill out the field');
                    result = await tier.getWarningText('supply')
                    await assert.equal(result, 'Please enter a valid number greater than 0', 'Incorrect error message');
                });

            test.it("User is able to fill out field 'Supply' with valid data",
                async function () {
                    tierPage.tier.supply = newValue.tier1.supply;
                    let result = await tierPage.fillSupply();
                    return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is able to fill out field 'Supply' with valid data");
                });

            test.it("Checkbox 'Allow Modify' is 'No' by default",
                async function () {
                    const result = await tierPage.isSelectedCheckboxAllowModifyNo()
                        && !await tierPage.isSelectedCheckboxAllowModifyYes();
                    return await assert.equal(result, true, "Tier#1: checkbox 'Allow modifying' isn't 'No' by default ");
                });

            test.it("Checkbox 'Enable Whitelist' is 'No' by default",
                async function () {
                    const result = await tierPage.isSelectedCheckboxWhitelistNo()
                        && !await tierPage.isSelectedCheckboxWhitelistYes();
                    return await assert.equal(result, true, "Checkbox 'Enable whitelisting' isn't 'No' by default ");
                });

            test.it("User is able to set checkbox 'Allow Modify Yes'",
                async function () {
                    const result = await tierPage.clickCheckboxAllowModifyYes()
                        && await tierPage.isSelectedCheckboxAllowModifyYes()
                        && !await tierPage.isSelectedCheckboxAllowModifyNo()
                    return await assert.equal(result, true, "Checkbox 'Allow Modify Yes' isn't selected ");
                });

            test.it("Whitelist container isn't displayed if checkbox 'Whitelist enabled' is 'No'",
                async function () {
                    const result = await tierPage.isDisplayedWhitelistContainer();
                    return await assert.equal(result, false, "Unexpected whitelist container is displayed");
                });

            test.it("User is able to set checkbox 'Enable whitelisting Yes'",
                async function () {
                    const result = await tierPage.clickCheckboxWhitelistYes()
                        && await tierPage.isSelectedCheckboxWhitelistYes()
                        && !await tierPage.isSelectedCheckboxWhitelistNo()
                    return await assert.equal(result, true, "Checkbox 'Enable whitelisting Yes' isn't selected ");
                });

            test.it("Whitelist container is presented if checkbox 'Enable whitelisting Yes' is selected",
                async function () {
                    const result = await tierPage.isDisplayedWhitelistContainer();
                    return await assert.equal(result, true, "Whitelist container isn't displayed");
                });

            test.it("Field 'Min cap' is disabled if whitelist enabled",
                async function () {
                    const tierNumber = 1;
                    const result = await tierPage.isDisabledFieldMinCap(tierNumber);
                    return await assert.equal(result, true, "field 'Min cap' is  disabled if whitelist enabled");
                });

            test.it("User is able to fill out field 'Setup name' with valid data",
                async function () {
                    tierPage.tier.name = newValue.tier1.name;
                    const result = await tierPage.fillSetupName();
                    return await assert.equal(result, true, "user is able to fill out field 'Supply' with valid data");
                });

            test.it("User is able to download CSV file with whitelisted addresses",
                async function () {
                    const fileName = "./public/whitelistAddressesTestValidation.csv";
                    const result = await tierPage.uploadWhitelistCSVFile(fileName)
                        && await tierPage.waitUntilShowUpPopupConfirm(180)
                    return await assert.equal(result, true, "user isn't able to download CVS file with whitelisted addresses");
                });

            test.it("Check validator for *.csv files with whitelisted addresses",
                async function () {
                    const text = await tierPage.getTextPopup()
                    return await assert.equal(text, TEXT.WHITELIST_VALIDATOR, "validator's message is incorrect")
                });

            test.it("Number of added whitelisted addresses is zero",
                async function () {
                    await tierPage.clickButtonOk()
                    const shouldBe = 0;
                    const inReality = await tierPage.amountAddedWhitelist(15);
                    return await assert.equal(shouldBe, inReality, "number of added whitelisted addresses isn't correct");
                });

            test.it("User isn't able to download CSV file with more than 50 whitelisted addresses",
                async function () {
                    const fileName = "./public/whitelistedAddresses61.csv";
                    const result = await tierPage.uploadWhitelistCSVFile(fileName);
                    return await assert.equal(result, true, "user is able to download CVS file with more than 50 whitelisted addresses");
                });

            test.it("Popup window is displayed if number of whitelisted addresses greater than 50",
                async function () {
                    const result = await tierPage.waitUntilShowUpPopupConfirm(100)
                    return await assert.equal(result, true, "no popup if number of whitelisted addresses greater than 50");
                });

            test.it("Popup has correct text",
                async function () {
                    const text = await tierPage.getTextPopup()
                    await assert.equal(text, TEXT.WHITELIST_MAX_REACHED, "popup's text is  incorrect")
                });

            test.it("Confirm popup",
                async function () {
                    const result = await wizardStep3.clickButtonOk();
                    return await assert.equal(result, true, "button 'Ok' doesn't present")
                });

            test.it('Number of added whitelisted addresses is correct, data is valid',
                async function () {
                    const shouldBe = 50;
                    const inReality = await tierPage.amountAddedWhitelist();
                    return await assert.equal(shouldBe, inReality, "number of added whitelisted addresses isn't correct");
                });

            test.it("Field 'Supply' disabled if whitelist added",
                async function () {
                    const result = await tierPage.isDisabledFieldSupply();
                    return await assert.equal(result, true, "field 'Min cap' is  disabled if whitelist is enabled");
                });

            test.it('User is able to bulk delete all whitelisted addresses ',
                async function () {
                    const result = await tierPage.clickButtonClearAll()
                        && await tierPage.waitUntilShowUpPopupConfirm(180)
                        && await tierPage.clickButtonYesAlert();
                    return await assert.equal(result, true, "user is not able to bulk delete all whitelisted addresses");
                });

            test.it("Field 'Supply' enabled if whitelist was deleted",
                async function () {
                    await Utils.delay(2000)
                    const result = await tierPage.isDisabledFieldSupply();
                    return await assert.equal(result, false, "field 'Supply' is disabled ");
                });

            test.it('User is able sequental to add several whitelisted addresses  ',
                async function () {
                    const result = await wizardStep3.refresh()//for prevent ElementNotVisibleError
                        && (await reservedTokensPage.isPresentAlert() ? await reservedTokensPage.acceptAlert() : true)
                        && await reservedTokensPage.waitUntilDisappearAlert()
                        && await reservedTokensPage.waitUntilLoaderGone()
                        && await tierPage.fillWhitelist();
                    return await assert.equal(result, true, "user isn't able to add several whitelisted addresses");
                });

            test.it('User is able to remove one whitelisted address',
                async function () {
                    const beforeRemoving = await tierPage.amountAddedWhitelist();
                    const numberAddressForRemove = 1;
                    await tierPage.removeWhiteList(numberAddressForRemove - 1);
                    const afterRemoving = await tierPage.amountAddedWhitelist();
                    return await assert.equal(beforeRemoving, afterRemoving + 1, "User is NOT able to remove one whitelisted address");
                });
        })
        describe('Tier#2:', async function () {

            test.it("User is able to add tier",
                async function () {
                    tierPage.number = 1;
                    const result = await wizardStep3.clickButtonAddTier();
                    return await assert.equal(result, true, "user is able to add tier");
                });

            test.it("Field 'Setup name' has correct placeholder",
                async function () {
                    const result = await tierPage.getValueFieldSetupName();
                    return await assert.equal(result, placeholder.setupNameTier2, "field 'Setup name' has incorrect placeholder ");
                });

            test.it("User is able to fill out field 'Setup name' with valid data",
                async function () {
                    tierPage.tier.name = newValue.tier2.name;
                    let result = await tierPage.fillSetupName();
                    return await assert.equal(result, true, "user isn't  able to fill out field 'Setup name'");
                });

            test.it("User is able to fill out field 'Rate' with valid data",
                async function () {

                    tierPage.tier.rate = newValue.tier2.rate;
                    let result = await tierPage.fillRate();
                    return await assert.equal(result, true, "user is NOT able to fill out field 'Rate'");
                });

            test.it("User is able to fill out field 'Supply' with valid data",
                async function () {
                    tierPage.tier.supply = newValue.tier2.supply;
                    let result = await tierPage.fillSupply();
                    return await assert.equal(result, true, "user is able to fill out field 'Supply'");
                });

            test.it("User is able to fill out field 'Min cap' with valid data",
                async function () {
                    tierPage.tier.minCap = newValue.tier2.mincap;
                    let tierNumber = 2;
                    let result = await tierPage.fillMinCap(tierNumber,);
                    return await assert.equal(result, true, "user is able to fill out field 'Min cap'");
                });

            test.it("Checkbox 'Allow Modify' is 'No' by default",
                async function () {
                    const result = await tierPage.isSelectedCheckboxAllowModifyNo()
                        && !await tierPage.isSelectedCheckboxAllowModifyYes();
                    return await assert.equal(result, true, "checkbox 'Allow Modify' isn't OFF by default ");
                });

            test.it("Checkbox 'Enable Whitelist' is 'No' by default",
                async function () {
                    const result = await tierPage.isSelectedCheckboxWhitelistNo()
                        && !await tierPage.isSelectedCheckboxWhitelistYes();
                    return await assert.equal(result, true, "Checkbox 'Enable Whitelist' isn't NO by default ");
                });

            test.it("Whitelist container isn't displayed if checkbox 'Whitelist enabled' is 'No'",
                async function () {
                    const result = await tierPage.isDisplayedWhitelistContainer();
                    console.log("result" + result)
                    return await assert.equal(result, false, "Unexpected whitelist container is displayed");
                });

        })
        describe("Check persistant", async function () {

            test.it.skip("Move back/forward - page keep state",
                async function () {
                    const result = await wizardStep3.goBack()
                        && await wizardStep2.waitUntilDisplayedFieldName()
                        && await Utils.delay(5000)
                        && await wizardStep3.goForward()
                        && await wizardStep1.waitUntilLoaderGone()
                        && await wizardStep3.waitUntilDisplayedFieldWalletAddress()
                    await assert.equal(result, true, "Page crashed after moving back/forward");
                    await assert.equal(await wizardStep3.isSelectedCheckboxGasCustom(), true, "Checkbox gasprice 'Custom' lost state after moving back/forward");
                    await assert.equal(await wizardStep3.getValueFieldGasCustom(), newValue.customGas, "field 'Gas Custom' lost value after moving back/forward");
                    await assert.equal(await wizardStep3.getValueFieldWalletAddress(), Owner.account, "field 'Wallet address' lost value after moving back/forward");
                    tierPage.number = 0
                    await assert.equal(await tierPage.isSelectedCheckboxAllowModifyNo(), false, "Tier#" + tierPage.number + " Checkbox 'Allow modifying Yes' lost state after moving back/forward");
                    await assert.equal(await tierPage.isSelectedCheckboxAllowModifyYes(), true, "Tier#" + tierPage.number + " Checkbox 'Allow modifying No' lost state after moving back/forward");

                    await assert.equal(await tierPage.isSelectedCheckboxWhitelistYes(), true, "Tier#" + tierPage.number + " Checkbox 'Enable whitelist Yes' lost state after moving back/forward");
                    await assert.equal(await tierPage.isSelectedCheckboxWhitelistNo(), false, "Tier#" + tierPage.number + "Checkbox 'Enable whitelist No' lost state after moving back/forward");

                    await assert.equal(await tierPage.getValueFieldSetupName(), newValue.tier1.name, "Tier#" + tierPage.number + " field 'Setup name' lost value after moving back/forward");
                    await assert.equal(await tierPage.getValueFieldRate(), newValue.tier1.rate, "Tier#" + tierPage.number + " field 'Rate' lost value after moving back/forward");
                    await assert.equal(await tierPage.getValueFieldSupply(), newValue.tier1.supply, "Tier#" + tierPage.number + " field 'Supply' lost value after moving back/forward");
                    await assert.equal(await tierPage.getValueFieldMinCap(), 0, "Tier#" + tierPage.number + " field 'Mincap' lost value after moving back/forward");
                    await assert.equal(await tierPage.isDisabledFieldMinCap(), true, "Tier#" + tierPage.number + " field 'Mincap' became enabled after moving back/forward");
                    tierPage.number = 1;
                    await assert.equal(await tierPage.getValueFieldSetupName(), newValue.tier2.name, "Tier#" + tierPage.number + " field 'Setup name' lost value after moving back/forward");
                    await assert.equal(await tierPage.getValueFieldRate(), newValue.tier2.rate, "Tier#" + tierPage.number + " field 'Rate' lost value after moving back/forward");
                    await assert.equal(await tierPage.getValueFieldSupply(), newValue.tier2.supply, "Tier#" + tierPage.number + " field 'Supply' lost value after moving back/forward");
                    await assert.equal(await tierPage.getValueFieldMinCap(), newValue.tier2.mincap, "Tier#" + tierPage.number + " field 'Mincap' lost value after moving back/forward");
                    await assert.equal(await tierPage.isDisabledFieldMinCap(), false, "Tier#" + tierPage.number + " field 'Mincap' became disabled after moving back/forward");
                });

            test.it("Alert is displayed if reload the page",
                async function () {
                    const result = await wizardStep3.refresh()
                        && await wizardStep3.waitUntilLoaderGone()
                        && await Utils.delay(2000)
                        && await wizardStep2.isPresentAlert()
                        && await wizardStep2.acceptAlert()
                    return await assert.equal(result, true, "alert does not present");
                });

            test.it("Reload - page keep state of checkbox 'Whitelist with mincap'",
                async function () {
                    const result = await wizardStep3.waitUntilDisplayedFieldWalletAddress()
                    await assert.equal(result, true, "Page crashed after reloading");
                    await assert.equal(await wizardStep3.isSelectedCheckboxGasCustom(), true, "Checkbox gasprice 'Custom' lost state after reloading");
                    await assert.equal(await wizardStep3.getValueFieldGasCustom(), newValue.customGas, "field 'Gas Custom' lost value after reloading");
                    await assert.equal(await wizardStep3.getValueFieldWalletAddress(), Owner.account, "field 'Wallet address' lost value after reloading");
                    tierPage.number = 0
                    await assert.equal(await tierPage.isSelectedCheckboxAllowModifyNo(), false, "Tier#" + tierPage.number + " Checkbox 'Allow modifying Yes' lost state after reloading");
                    await assert.equal(await tierPage.isSelectedCheckboxAllowModifyYes(), true, "Tier#" + tierPage.number + " Checkbox 'Allow modifying No' lost state after reloading");

                    await assert.equal(await tierPage.isSelectedCheckboxWhitelistYes(), true, "Tier#" + tierPage.number + " Checkbox 'Enable whitelist Yes' lost state after reloading");
                    await assert.equal(await tierPage.isSelectedCheckboxWhitelistNo(), false, "Tier#" + tierPage.number + "Checkbox 'Enable whitelist No' lost state after reloading");

                    await assert.equal(await tierPage.getValueFieldSetupName(), newValue.tier1.name, "Tier#" + tierPage.number + " field 'Setup name' lost value after reloading");
                    await assert.equal(await tierPage.getValueFieldRate(), newValue.tier1.rate, "Tier#" + tierPage.number + " field 'Rate' lost value after reloading");
                    await assert.equal(await tierPage.getValueFieldSupply(), newValue.tier1.supply, "Tier#" + tierPage.number + " field 'Supply' lost value after reloading");
                    await assert.equal(await tierPage.getValueFieldMinCap(), 0, "Tier#" + tierPage.number + " field 'Mincap' lost value after reloading");
                    await assert.equal(await tierPage.isDisabledFieldMinCap(), true, "Tier#" + tierPage.number + " field 'Mincap' became enabled after reloading");
                    tierPage.number = 1;
                    await assert.equal(await tierPage.getValueFieldSetupName(), newValue.tier2.name, "Tier#" + tierPage.number + " field 'Setup name' lost value after reloading");
                    await assert.equal(await tierPage.getValueFieldRate(), newValue.tier2.rate, "Tier#" + tierPage.number + " field 'Rate' lost value after reloading");
                    await assert.equal(await tierPage.getValueFieldSupply(), newValue.tier2.supply, "Tier#" + tierPage.number + " field 'Supply' lost value after reloading");
                    await assert.equal(await tierPage.getValueFieldMinCap(), newValue.tier2.mincap, "Tier#" + tierPage.number + " field 'Mincap' lost value after reloading");
                    await assert.equal(await tierPage.isDisabledFieldMinCap(), false, "Tier#" + tierPage.number + " field 'Mincap' became disabled after reloading");

                });

            test.it("Change network - page keep state of checkbox 'Whitelist with mincap'",
                async function () {
                    const result = await Investor1.setWalletAccount()
                        && await wizardStep1.waitUntilLoaderGone()
                        && await Owner.setWalletAccount()
                        && await wizardStep3.waitUntilDisplayedFieldWalletAddress()
                    await Utils.delay(2000)
                    await assert.equal(result, true, "Page crashed after go back/forward");
                    await assert.equal(await wizardStep3.isSelectedCheckboxGasCustom(), true, "Checkbox gasprice 'Custom' lost state after changing network");
                    await assert.equal(await wizardStep3.getValueFieldGasCustom(), newValue.customGas, "field 'Gas Custom' lost value after changing network");
                    await assert.equal(await wizardStep3.getValueFieldWalletAddress(), Owner.account, "field 'Wallet address' lost value after changing network");
                    tierPage.number = 0
                    await assert.equal(await tierPage.isSelectedCheckboxAllowModifyNo(), false, "Tier#" + tierPage.number + " Checkbox 'Allow modifying Yes' lost state after changing network");
                    await assert.equal(await tierPage.isSelectedCheckboxAllowModifyYes(), true, "Tier#" + tierPage.number + " Checkbox 'Allow modifying No' lost state after changing network");

                    await assert.equal(await tierPage.isSelectedCheckboxWhitelistYes(), true, "Tier#" + tierPage.number + " Checkbox 'Enable whitelist Yes' lost state after changing network");
                    await assert.equal(await tierPage.isSelectedCheckboxWhitelistNo(), false, "Tier#" + tierPage.number + "Checkbox 'Enable whitelist No' lost state after changing network");

                    await assert.equal(await tierPage.getValueFieldSetupName(), newValue.tier1.name, "Tier#" + tierPage.number + " field 'Setup name' lost value after changing network");
                    await assert.equal(await tierPage.getValueFieldRate(), newValue.tier1.rate, "Tier#" + tierPage.number + " field 'Rate' lost value after changing network");
                    await assert.equal(await tierPage.getValueFieldSupply(), newValue.tier1.supply, "Tier#" + tierPage.number + " field 'Supply' lost value after changing network");
                    await assert.equal(await tierPage.getValueFieldMinCap(), 0, "Tier#" + tierPage.number + " field 'Mincap' lost value after changing network");
                    await assert.equal(await tierPage.isDisabledFieldMinCap(), true, "Tier#" + tierPage.number + " field 'Mincap' became enabled after changing network");
                    tierPage.number = 1;
                    await assert.equal(await tierPage.getValueFieldSetupName(), newValue.tier2.name, "Tier#" + tierPage.number + " field 'Setup name' lost value after changing network");
                    await assert.equal(await tierPage.getValueFieldRate(), newValue.tier2.rate, "Tier#" + tierPage.number + " field 'Rate' lost value after changing network");
                    await assert.equal(await tierPage.getValueFieldSupply(), newValue.tier2.supply, "Tier#" + tierPage.number + " field 'Supply' lost value after changing network");
                    await assert.equal(await tierPage.getValueFieldMinCap(), newValue.tier2.mincap, "Tier#" + tierPage.number + " field 'Mincap' lost value after changing network");
                    await assert.equal(await tierPage.isDisabledFieldMinCap(), false, "Tier#" + tierPage.number + " field 'Mincap' became disabled after changing network");
                });

            test.it('User is able to proceed to Step4 by clicking button Continue ',
                async function () {
                    let result
                    try {
                        result = await wizardStep3.clickButtonContinue()

                            && await wizardStep4.waitUntilDisplayedModal(60)
                    }
                    catch ( err ) {
                        console.log(err)
                        await wizardStep4.acceptAlert()
                    }
                    return await assert.equal(result, true, "Modal isn't displayed");
                });
        })
    })

    describe("Step#4:", async function () {

        test.it("Check status of transaction, should be 'Please confirm Tx'",
            async function () {
                await Utils.delay(2000)
                if ( await wizardStep4.isPresentAlert() ) await wizardStep4.acceptAlert()
                const result = await wizardStep4.getTxStatus()
                console.log(result)
                return await assert.equal(result.includes('Please confirm Tx'), true, "tx status is incorrect");
            });

        test.it("Alert present if user reload the page",
            async function () {
                await wizardStep4.refresh();
                await driver.sleep(2000);
                const result = await wizardStep4.isPresentAlert();
                return await assert.equal(result, true, "alert does not present if user refresh the page");
            });

        test.it("Warning after accepting alert",
            async function () {
                const result = await wizardStep4.acceptAlert()
                    && await wizardStep4.waitUntilShowUpWarning(80);
                return await assert.equal(result, true, "alert isn't displayed");
            });

        test.it("Check warning's text",
            async function () {
                const result = await wizardStep4.getTextWarning()
                const shouldBe = 'Please cancel pending transaction, if there\'s any, in your wallet (Nifty Wallet or Metamask) and Continue'
                return await assert.equal(result, shouldBe, "warning's text is incorrect");
            });

        test.it("Modal is displayed after confirm warning",
            async function () {
                const result = await wizardStep4.clickButtonOk()
                    && await wizardStep4.waitUntilDisplayedModal(80);
                return await assert.equal(result, true, "modal isn't displayed");
            });

        test.it("Check status of transaction, should be 'Please confirm Tx'",
            async function () {
                const result = await wizardStep4.getTxStatus()
                console.log(result)
                return await assert.equal(result.includes('Please confirm Tx'), true, 'tx status is incorrect');
            });

        test.it("Button 'Skip transaction' is displayed if user reject a transaction",
            async function () {
                const result = await wallet.rejectTransaction(20)
                    && await wizardStep4.isDisplayedButtonSkipTransaction();
                return await assert.equal(result, true, "button 'Skip transaction' isn't displayed if user rejected the transaction");
            });

        test.it("Button 'Retry transaction' is displayed if user reject a transaction",
            async function () {
                const result = await wizardStep4.isDisplayedButtonRetryTransaction()
                return await assert.equal(result, true, "button 'Retry transaction' isn't displayed if user rejected the transaction");
            });

        test.it("User is able to retry transaction",
            async function () {
                const result = await wizardStep4.clickButtonRetryTransaction()
                return await assert.equal(result, true, "user is not able to retry transaction");
            });

        test.it("user able to confirm transaction",
            async function () {
                const result = await Utils.delay(5000)
                    && await wallet.signTransaction(20)
                    && await wizardStep4.isDisplayedModal()
                return await assert.equal(result, true, "user is not able to confirm transaction");
            });

        test.it("Warning if user skipped transaction",
            async function () {

                const result = await wizardStep4.refresh()
                    && await Utils.delay(5000)
                    && await wizardStep4.isPresentAlert()
                    && await wizardStep4.acceptAlert()
                    && await wizardStep4.waitUntilShowUpWarning(80)
                    && await wizardStep4.clickButtonOk()
                    && await Utils.delay(5000)
                    && await wallet.rejectTransaction(20)
                    // && await wizardStep4.waitUntilLoaderGone(20)
                    && await wizardStep4.clickButtonSkipTransaction()
                    && await wizardStep4.waitUntilShowUpWarning(80)
                return await assert.equal(result, true, "button 'Skip transaction' isn't clickable");
            });

        test.it("Check warning's text",
            async function () {
                const result = await wizardStep4.getTextWarning()
                const shouldBe = 'Are you sure you want to skip the transaction? This can leave the whole crowdsale in an invalid state, only do this if you are sure of what you are doing.'
                return await assert.equal(result, shouldBe, "warning's text is incorrect");
            });

        test.it("Confirm warning",
            async function () {
                const result = await wizardStep4.clickButtonOk()
                    && await wizardStep4.waitUntilDisplayedModal(80);
                return await assert.equal(result, true, "can not confirm warning");
            });

        test.it("Alert if user leaves TW",
            async function () {
                await wizardStep4.open('localhost:3000/?uiversion=2')
                const result = await wizardStep4.acceptAlert();
                return await assert.equal(result, true, "alert does not present if user wants to leave TW");
            });

        test.it("Welcome page: button 'Resume crowdsale' is displayed if pending deployment ",
            async function () {
                const result = await welcomePage.waitUntilDisplayedButtonResume(180)
                return await assert.equal(result, true, "welcome page is not available ")
            });

        test.it("Welcome page: button 'Cancel crowdsale' is displayed if pending deployment ",
            async function () {
                const result = await welcomePage.isDisplayedButtonCancel(180)
                return await assert.equal(result, true, "welcome page is not available ")
            });

        test.it("Welcome page: user able to resume a pending crowdsale",
            async function () {
                const result = await welcomePage.clickButtonResume(180)
                    && await wizardStep4.waitUntilDisplayedModal()
                return await assert.equal(result, true, "user isn't able to resume crowdsale")
            });
        test.it("Alert if user leaves TW",
            async function () {
                await wizardStep4.open('localhost:3000/?uiversion=2')
                await Utils.delay(2000)
                if ( await wizardStep4.isPresentAlert() ) await wizardStep4.acceptAlert()
                //return await assert.equal(result, true, "alert does not present if user wants to leave TW");
            });

        test.it("Welcome page: user is able to cancel a pending crowdsale",
            async function () {
                const result = await welcomePage.waitUntilLoaderGone()
                    && await welcomePage.waitUntilDisplayedButtonResume(180)
                    && await welcomePage.clickButtonCancel(180)
                    && await welcomePage.waitUntilShowUpWarning(180)
                    && await welcomePage.clickButtonOk()
                    && await welcomePage.waitUntilDisplayedButtonNewCrowdsale()
                    && await welcomePage.isDisplayedButtonChooseContract()
                return await assert.equal(result, true, "user isn't able to cancel a pending crowdsale")
            });
        test.it("User is able to start new crowdsale after cancelation of pending crowdsale",
            async function () {
                const result = await welcomePage.clickButtonNewCrowdsale()
                    && await wizardStep1.waitUntilDisplayedCheckboxWhitelistWithCap();
                return await assert.equal(result, true, "user is not able to activate Step1 by clicking button 'New crowdsale'");
            });

    })


})
