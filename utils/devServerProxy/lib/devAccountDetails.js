import fs from 'fs';
import path from 'path';

import devAccountMap from '../config/devAccounts.config';
import devAccountMapV2 from '../config/devAccountsV2.config';
import { getTerms } from './mockTerms';
import { localizeCurrency, localizeNumber } from './miscellaneous';

const CONTENT_PATH = path.resolve(__dirname, '../../../content');

const selectBestOffer = (offers = [], amount) =>
    offers.reduce(
        (acc, offer) =>
            (offer.min && amount < offer.min) ||
            (offer.max && amount > offer.max) ||
            acc?.totalPayments > offer.totalPayments
                ? acc
                : offer,
        undefined
    );

const getMorsVars = (country, offer, amount) => {
    const toLocaleNumber = localizeNumber(country);
    const toLocaleCurrency = localizeCurrency(country);
    const { apr, nominalRate, totalPayments, minAmount, maxAmount } = offer;
    const total = Number(amount) + Number(amount) * (apr * 0.01) * (totalPayments / 12);
    const totalInterest = total - Number(amount);

    return {
        financing_code: Math.random()
            .toString(36)
            .slice(2),
        qualifying_offer: (amount >= minAmount ?? 0) && (amount <= maxAmount ?? Infinity) ? 'true' : 'false',
        apr,
        nominal_rate: nominalRate,
        minAmount: minAmount.toString(),
        maxAmount: maxAmount.toString(),
        total_payments: totalPayments,
        transaction_amount: amount ? amount.toString() : '-',
        formattedAPR: toLocaleNumber(apr),
        formattedMinAmount: toLocaleCurrency(minAmount),
        formattedMaxAmount: toLocaleCurrency(maxAmount),
        formattedTransactionAmount: amount ? toLocaleCurrency(amount) : '-',
        formattedTotalCost: amount ? toLocaleCurrency(total) : '-',
        formattedPeriodicPayment: amount ? toLocaleCurrency(total / totalPayments) : '-',
        formattedMonthlyPayment: amount ? toLocaleCurrency(total / totalPayments) : '-',
        formattedTotalInterest: amount ? toLocaleCurrency(totalInterest) : '-'
    };
};

export default function getDevAccountDetails({ account, amount, buyerCountry }) {
    if (devAccountMap[account]) {
        const [country, productNames, messageName] = devAccountMap[account];
        const offers = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config/terms.json'), 'utf-8'));
        const terms = getTerms(country, offers, Number(amount));

        return {
            country,
            terms,
            modalViews: productNames.map(modalName => ({
                template: fs.readFileSync(`${CONTENT_PATH}/modals/${country}/${modalName}.json`, 'utf8'),
                morsVars: getMorsVars(country, selectBestOffer(offers, amount), amount)
            })),
            message: {
                template: fs.readFileSync(`${CONTENT_PATH}/messages/${country}/${messageName}.json`, 'utf8'),
                morsVars: getMorsVars(country, selectBestOffer(offers, amount), amount)
            }
        };
    }

    if (devAccountMapV2[account]) {
        const { country, modalViews, messageThresholds, offers } = devAccountMapV2[account];
        const selectedMessage =
            messageThresholds.find(({ amount: minAmount }) => minAmount < amount) ??
            messageThresholds[messageThresholds.length - 1];

        const messageTemplate =
            buyerCountry && buyerCountry !== country && selectedMessage.templateXB
                ? fs.readFileSync(`${CONTENT_PATH}/messages/${country}/${selectedMessage.templateXB}`, 'utf8')
                : fs.readFileSync(`${CONTENT_PATH}/messages/${country}/${selectedMessage.template}`, 'utf8');

        return {
            country,
            modalViews: modalViews.map(({ template, offersTemplate, product }) => {
                const viewTemplate = JSON.parse(
                    fs.readFileSync(`${CONTENT_PATH}/modals/${country}/${template}`, 'utf8')
                );
                delete viewTemplate.meta.variables; // Not part of the final response

                const viewOffersTemplate =
                    offersTemplate &&
                    JSON.parse(fs.readFileSync(`${CONTENT_PATH}/offers/${country}/${offersTemplate}`, 'utf8'));

                if (viewOffersTemplate) {
                    delete viewOffersTemplate.meta.variables; // Not part of the final response
                }

                const viewOffers = offers[product];

                return {
                    template: JSON.stringify(viewTemplate),
                    morsVars: viewOffers ? getMorsVars(country, selectBestOffer(viewOffers, amount), amount) : {},
                    offers:
                        viewOffersTemplate &&
                        viewOffers &&
                        viewOffers.map(offer => ({
                            template: JSON.stringify(viewOffersTemplate),
                            morsVars: getMorsVars(country, offer, amount)
                        }))
                };
            }),
            message: {
                template: messageTemplate,
                morsVars: getMorsVars(country, selectBestOffer(offers[selectedMessage.product], amount), amount)
            }
        };
    }

    throw new Error(`Missing dev account: ${account}`);
}
