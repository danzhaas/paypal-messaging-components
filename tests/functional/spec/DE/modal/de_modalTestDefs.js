import selectors from '../../utils/selectors';
import { logTestName } from '../../utils/logging';
import modalSnapshot from '../../utils/modalSnapshot';

/**
 * Runs inside modalTextCalc and modalFlexCalc for the DE locale.
 */

export const nonQualErrorMsg = ({ account, viewport, groupString }) => async () => {
    const testNameParts = 'DE non-qualifying amount error message';
    logTestName({ account, viewport, groupString, testNameParts });

    const elementModal = await page.$(selectors.modal.iframe);

    const modalFrame = await elementModal.contentFrame();
    await page.waitFor(2 * 1000);
    await modalFrame.waitForSelector(selectors.calculator.calcForm);
    await page.waitFor(1000);
    await modalFrame.click(selectors.calculator.calcInput, { clickCount: 3 });
    await page.waitFor(1000);

    await modalFrame.type(selectors.calculator.calcInput, '2');
    // Wait for recalculate to fire automatically
    await page.waitFor(2000);
    await modalFrame.waitForSelector(selectors.modal.instructions);
    await page.waitFor(4 * 1000);

    const instructions = await modalFrame.$eval(selectors.modal.instructions, element => element.innerHTML);
    expect(instructions).toContain('Wählen Sie');
    expect(instructions).toContain('PayPal');
    expect(instructions).toContain('als Bezahlmethode aus und zahlen Sie mit der PayPal Ratenzahlung.');
    await page.waitFor(800);

    await modalSnapshot(`${groupString} ${testNameParts}`, viewport, account);
};

export const updateFinanceTerms = ({ account, viewport, groupString }) => async () => {
    const testNameParts = 'DE update finance terms';
    logTestName({ account, viewport, groupString, testNameParts });

    await page.waitForFunction(
        iframeSelector =>
            Array.from(document.querySelectorAll(iframeSelector)).find(
                el => el.parentElement.parentElement.style.display !== 'none'
            ),
        {},
        selectors.modal.iframe
    );
    const elementModal = await page.$(selectors.modal.iframe);
    const modalFrame = await elementModal.contentFrame();
    await modalFrame.waitForSelector(selectors.modal.container, { visible: true });
    await page.waitFor(2000);

    await modalFrame.waitForSelector(selectors.calculator.calc, { visible: true });
    await modalFrame.click(selectors.calculator.calcInput, { clickCount: 3 });
    await modalFrame.type(selectors.calculator.calcInput, '650', { delay: 100 });
    // Wait for recalculate to fire automatically
    await page.waitFor(2000);
    await page.waitFor(4 * 1000);

    await modalSnapshot(`${groupString} ${testNameParts}`, viewport, account);
};

export const deModalContentAndCalc = ({ account, viewport, groupString, amount }) => async () => {
    const testNameParts = 'DE message content';
    logTestName({ account, viewport, groupString, testNameParts });

    const elementModal = await page.$(selectors.modal.iframe);
    const modalFrame = await elementModal.contentFrame();
    await modalFrame.waitForSelector(selectors.calculator.calc);

    const calc = modalFrame.$eval(selectors.calculator.calc, element => element);
    expect(calc).toBeTruthy();

    // Modal only shows this title if no initial amount is passed
    if (!amount) {
        const calcTitle = await modalFrame.$eval(selectors.calculator.calcTitle, element => element.innerText);
        expect(calcTitle).toContain('Was kostet Ihr Einkauf?');
        await page.waitFor(800);
    }

    await modalSnapshot(`${groupString} ${testNameParts}`, viewport, account);
};

// Switch from Product List to option 1; switch from Product list to option 2
export const selectProductsFromList = ({ account, viewport, groupString }) => async () => {
    const testNameParts = 'Product List buttons for PI30 and GPL click';
    logTestName({ account, viewport, groupString, testNameParts });

    const elementBanner = await page.$(selectors.banner.wrapper);
    const elementModal = await page.$(selectors.modal.iframe);
    const modalFrame = await elementModal.contentFrame();
    console.log('modal frame', modalFrame);
    // take screencap of Product List
    await modalSnapshot(`${groupString} ${testNameParts} - Product List`, viewport, account);
    // select the first button
    await modalFrame.click(selectors.button.pi30Button);
    await page.waitFor(200);
    // expect header to contain Pi30 content
    // const pi30Headline = await modalFrame.$eval(selectors.modal.headerHeadline, element => element.innerText);
    // expect(pi30Headline).toContain('Kaufen Sie jetzt was Sie möchten, bezahlen Sie erst in 30 Tagen');
    await modalSnapshot(`${groupString} ${testNameParts} - Pi30`, viewport, account);
    // close then open modal
    await modalFrame.click(selectors.button.closeBtn);
    await page.waitFor(1000);
    await elementBanner.click();
    await page.waitFor(1000);
    const secondElementModal = await page.$(selectors.modal.iframe);
    const secondModalFrame = await secondElementModal.contentFrame();
    console.log('second Modal Frame', secondModalFrame);
    // select second button
    await secondModalFrame.click(selectors.button.gplButton);
    await page.waitFor(200);
    // expect header to contain GPL content
    // const gplHeadline = await secondModalFrame.$eval(selectors.modal.headerHeadline, element => element.innerText);
    // expect(gplHeadline).toContain('Später bezahlen in 3, 6, 12 oder 24 monatlichen Raten');
    await modalSnapshot(`${groupString} ${testNameParts} - GPL`, viewport, account);
    await secondModalFrame.click(selectors.button.closeBtn);
    await page.waitFor(1000);
};

// Switch from Pi30 to GPL with link click
export const switchProducts = ({ account, viewport, groupString }) => async () => {
    const testNameParts = 'PI30 and GPL switch-text links click';
    logTestName({ account, viewport, groupString, testNameParts });

    const elementModal = await page.$(selectors.modal.iframe);
    const modalFrame = await elementModal.contentFrame();
    // select the first button in Product List
    await modalFrame.click(selectors.button.pi30Button);
    await page.waitFor(200);
    // expect header to contain Pi30 content
    // const pi30Headline = await modalFrame.$eval(selectors.modal.headerHeadline, element => element.innerText);
    // expect(pi30Headline).toContain('Kaufen Sie jetzt was Sie möchten, bezahlen Sie erst in 30 Tagen');
    await modalSnapshot(`${groupString} ${testNameParts} (Pi30 Visible)`, viewport, account);
    // click switch text
    modalFrame.click(selectors.button.switchingLink);
    await page.waitFor(200);
    // expect header to contain GPL content
    // const gplHeadline = await modalFrame.$eval(selectors.modal.headerHeadline, element => element.innerText);
    // expect(gplHeadline).toContain('Später bezahlen in 3, 6, 12 oder 24 monatlichen Raten');
    await modalSnapshot(`${groupString} ${testNameParts} (GPL Visible)`, viewport, account);
    // click switch text
    modalFrame.click(selectors.button.switchingLink);
    await page.waitFor(200);
    // expect header to contain Pi30 content
    const Pi30Headline = await modalFrame.$eval(selectors.modal.headerHeadline, element => element.innerText);
    expect(Pi30Headline).toContain('Kaufen Sie jetzt was Sie möchten, bezahlen Sie erst in 30 Tagen');
};
