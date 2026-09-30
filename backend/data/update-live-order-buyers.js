const ORDERS_API =
    "https://loom-plm.vercel.app/api/resources/orders?all=true";

const BUYERS_API =
    "https://loom-plm.vercel.app/api/resources/buyers";

// LIVE update endpoint
const UPDATE_BASE =
    "https://loom-plm.vercel.app/api/resources/orders";

const buyerNameMapping = {
    BABOLI: "222",
    GUESS: "900-K",
    LES: "977-L",
};

async function getJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `GET ${url} failed: ${response.status} ${response.statusText}`
        );
    }

    return response.json();
}

async function patchJson(url, body) {
    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }

    if (!response.ok) {
        throw new Error(
            `PATCH ${url} failed: ${response.status} ${response.statusText}\n` +
            JSON.stringify(data, null, 2)
        );
    }

    return data;
}

async function main() {
    console.log("\n========================================");
    console.log(" LIVE LOOM PLM BUYER UPDATE");
    console.log("========================================\n");

    console.log("Fetching live orders...");
    const ordersResponse = await getJson(ORDERS_API);

    console.log("Fetching live buyers...");
    const buyersResponse = await getJson(BUYERS_API);

    const orders = Array.isArray(ordersResponse)
        ? ordersResponse
        : ordersResponse.data ||
        ordersResponse.items ||
        ordersResponse.orders ||
        [];

    const buyers = Array.isArray(buyersResponse)
        ? buyersResponse
        : buyersResponse.data ||
        buyersResponse.items ||
        buyersResponse.buyers ||
        [];

    console.log(`Orders found : ${orders.length}`);
    console.log(`Buyers found : ${buyers.length}`);

    // ----------------------------------------
    // BUYER MASTER LOOKUP
    // ----------------------------------------

    const buyerLookup = {};

    for (const buyer of buyers) {
        buyerLookup[buyer.name] = buyer;
    }

    // ----------------------------------------
    // FIND ORDERS TO UPDATE
    // ----------------------------------------

    const matchingOrders = orders.filter((order) => {
        return Object.prototype.hasOwnProperty.call(
            buyerNameMapping,
            order.buyer
        );
    });

    console.log(
        `Orders matching buyer mapping : ${matchingOrders.length}`
    );

    if (matchingOrders.length === 0) {
        console.log("No matching orders found.");
        return;
    }

    // ----------------------------------------
    // BACKUP ORIGINAL ORDERS
    // ----------------------------------------

    const fs = await import("fs");

    fs.writeFileSync(
        "live-orders-before-buyer-update.json",
        JSON.stringify(matchingOrders, null, 2)
    );

    console.log(
        "\nBackup created: live-orders-before-buyer-update.json"
    );

    // ----------------------------------------
    // UPDATE COUNTERS
    // ----------------------------------------

    let successCount = 0;
    let failedCount = 0;

    const updatedOrders = [];
    const failedOrders = [];

    // ----------------------------------------
    // UPDATE EACH ORDER
    // ----------------------------------------

    for (const originalOrder of matchingOrders) {
        const oldBuyerName = originalOrder.buyer;

        const newBuyerName =
            buyerNameMapping[oldBuyerName];

        const buyer = buyerLookup[newBuyerName];

        if (!buyer) {
            console.error(
                `\n❌ Buyer master not found: ${newBuyerName}`
            );

            failedCount++;

            failedOrders.push({
                id: originalOrder.id,
                reason: `Buyer master not found: ${newBuyerName}`,
            });

            continue;
        }

        /*
         * IMPORTANT:
         *
         * Start with the COMPLETE existing order.
         * This means all existing fields remain untouched.
         *
         * Then only replace buyer-related fields.
         */

        const updatedOrder = {
            ...originalOrder,

            buyer: buyer.name,
            buyerId: buyer.id,
            merchandiserId:
                buyer.merchandiserIds?.[0] || null,
            fabricManagerId:
                buyer.fabricManagerIds?.[0] || null,
        };

        const orderId =
            originalOrder.id ||
            originalOrder.primaryId ||
            originalOrder.orderId;

        const updateUrl =
            `${UPDATE_BASE}/${encodeURIComponent(orderId)}`;

        console.log("\n----------------------------------------");
        console.log(`Updating order: ${orderId}`);
        console.log(`Buyer: ${oldBuyerName} -> ${buyer.name}`);
        console.log(`Buyer ID: ${buyer.id}`);
        console.log(
            `Merchandiser: ${buyer.merchandiserIds?.[0] || "NONE"}`
        );
        console.log(
            `Fabric Manager: ${buyer.fabricManagerIds?.[0] || "NONE"}`
        );

        try {
            const result = await patchJson(
                updateUrl,
                updatedOrder
            );

            successCount++;

            updatedOrders.push({
                id: orderId,
                oldBuyer: oldBuyerName,
                newBuyer: buyer.name,
                response: result,
            });

            console.log(`✅ Updated successfully: ${orderId}`);
        } catch (error) {
            failedCount++;

            failedOrders.push({
                id: orderId,
                oldBuyer: oldBuyerName,
                newBuyer: buyer.name,
                error: error.message,
            });

            console.error(
                `❌ Failed: ${orderId}`
            );

            console.error(error.message);
        }
    }

    // ----------------------------------------
    // SAVE UPDATE RESULT
    // ----------------------------------------

    fs.writeFileSync(
        "live-orders-update-result.json",
        JSON.stringify(
            {
                updatedAt: new Date().toISOString(),
                totalMatchingOrders: matchingOrders.length,
                successCount,
                failedCount,
                updatedOrders,
                failedOrders,
            },
            null,
            2
        )
    );

    // ----------------------------------------
    // FINAL SUMMARY
    // ----------------------------------------

    console.log("\n========================================");
    console.log(" UPDATE COMPLETED");
    console.log("========================================");

    console.log(
        `Total matching orders : ${matchingOrders.length}`
    );

    console.log(
        `Successfully updated  : ${successCount}`
    );

    console.log(
        `Failed                : ${failedCount}`
    );

    console.log(
        "\nBackup:"
    );

    console.log(
        "live-orders-before-buyer-update.json"
    );

    console.log(
        "\nResult:"
    );

    console.log(
        "live-orders-update-result.json"
    );

    console.log("\n========================================\n");
}

main().catch((error) => {
    console.error("\n❌ FATAL ERROR");
    console.error(error);
    process.exit(1);
});