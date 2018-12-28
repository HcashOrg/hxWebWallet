import operationTypes from "./operation_types";
import appState from "./appState";
let { PrivateKey, key, TransactionBuilder, TransactionHelper } = hx_js;

export default {
    OperationTypes: operationTypes.types,
    haveEnoughBalance(spendAmountNu, spendAssetId, feeNu, accountBalances) {
        if (spendAmountNu.lte(0) && feeNu.lte(0)) {
            return true;
        }
        let feeMatched = false;
        let amountMatched = false;
        for (let balance of accountBalances) {
            if (balance.assetId === "1.3.0") {
                if (balance.amountNu.lte(feeNu)) {
                    return false;
                }
                feeMatched = true;
            }
            if (balance.assetId === spendAssetId) {
                let balanceToCal = balance.amountNu;
                if (balance.assetId === "1.3.0") {
                    balanceToCal = balanceToCal.minus(feeNu);
                }
                if (spendAmountNu.gt(balanceToCal)) {
                    return false;
                }
                amountMatched = true;
            }
        }
        return feeMatched && amountMatched;
    },
    getOperationTypeName(opType) {
        return operationTypes.types[opType];
    },
    getTxType(tx) {
        if (!tx) {
            return null;
        }
        const operations = tx.operations;
        if (!operations || !tx.operations.length) {
            return null;
        }
        const firstOpTuple = operations[0];
        const opType = firstOpTuple[0];
        return operationTypes.types[opType];
    },
    hxAmountToString(val) {
        return new BigNumber(val)
            .div(Math.pow(10, appState.hxPrecision))
            .toFixed(appState.hxPrecision);
    },
    opTotalFee(opFeeAmount, gasCount, gasPrice) {
        return this.hxAmountToString(opFeeAmount + gasCount * gasPrice);
    },
    assetAmountToString(assetAmount) {
        // {amount: xxx, asset_id: xxx}
        let asset = appState.getAssetLocal(assetAmount.asset_id);
        if (!asset && assetAmount.asset_id === "1.3.0") {
            asset = { id: "1.3.0", symbol: "HX", precision: appState.hxPrecision };
        }
        if (asset) {
            return (
                new BigNumber(assetAmount.amount)
                    .div(Math.pow(10, asset.precision))
                    .toFixed(asset.precision) +
                " " +
                asset.symbol
            );
        }
        return assetAmount.amount + " " + assetAmount.asset_id;
    },
    getContractTxReceipts(apisInstance, txid) {
        return TransactionHelper.getContractTxReceipt(apisInstance, txid);
    },
    getTxReceiptStatus(apisInstance, tx) {
        const txType = this.getTxType(tx);
        if (["contract_register", "contract_invoke", "transfer_contract"].indexOf(txType) >= 0) {
            const txid = tx.trxid;
            return this.getContractTxReceipts(apisInstance, txid)
                .then((receipts) => {
                    const receipt = receipts[0]
                    if (receipt && receipt.exec_succeed) {
                        return "success";
                    } else {
                        return "fail";
                    }
                });
        } else {
            let success = tx.block_num && tx.block_num > 0;
            return Promise.resolve(success ? "success" : "fail");
        }
    },
    bytesToHex(bytes) {
        return TransactionHelper.bytes_to_hex(bytes);
    },
    hexToUnicodeString(s) {
        var escaped = "";
        var hex = "";
        if (s.length % 4 > 0) {
            for (i = 0; i < (4 - (s.length % 4)); i++) {
                hex += "0";
            }
        }
        hex += s;
        for (var i = 0; i < hex.length; i += 4) {
            escaped += "%u" + hex.charAt(i) + hex.charAt(i + 1) + hex.charAt(i + 2) + hex.charAt(i + 3);
        }
        return unescape(escaped).split(unescape("%00")).join("");
    },
    hexToString(hexStr) {
        const bytes = TransactionHelper.hex_to_bytes(hexStr);
        const str = String.fromCharCode.apply(null, bytes);
        return str;
    },
    formatTimezone(date) {
        const offset = date.getTimezoneOffset();
        let result = new Date(
            date.getTime() +
            (Math.sign(offset) !== -1
                ? -60000 * offset
                : 60000 * Math.abs(offset))
        );
        return result;
    },
    emptyHxBalance: {
        assetId: "1.3.0",
        assetSymbol: "HX",
        amountNu: new BigNumber(0),
        amount: 0
    }
};