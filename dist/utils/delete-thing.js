"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteThingAndCerts = deleteThingAndCerts;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const env_1 = require("../config/env");
const iot = new aws_sdk_1.default.Iot({
    region: env_1.env.aws.iotEndpoint || "ap-south-1",
});
const iotData = new aws_sdk_1.default.IotData({
    endpoint: env_1.env.aws.iotEndpoint, // a3xxxxx-ats.iot.ap-south-1.amazonaws.com
});
/**
 * FULL IoT cleanup BEFORE deleting a Thing.
 * Handles:
 *  - Thing Groups
 *  - Thing Types
 *  - Shadows
 *  - Certificates
 *  - Policies
 *  - Retry principal propagation
 */
async function deleteThingAndCerts(thingName) {
    console.log(`➡ Starting AWS IoT cleanup for: ${thingName}`);
    // --------------------------------------------------------
    // 0️⃣ REMOVE FROM ALL THING GROUPS
    // --------------------------------------------------------
    try {
        const { thingGroups = [] } = await iot
            .listThingGroupsForThing({ thingName })
            .promise();
        for (const g of thingGroups) {
            console.log(` Removing from Thing Group: ${g.groupName}`);
            await iot
                .removeThingFromThingGroup({
                thingGroupName: g.groupName,
                thingName,
            })
                .promise();
        }
    }
    catch (err) {
        console.warn(" Group removal warning:", err.message);
    }
    // --------------------------------------------------------
    // 1️⃣ REMOVE THING TYPE (CRITICAL!)
    // --------------------------------------------------------
    try {
        const desc = await iot.describeThing({ thingName }).promise();
        if (desc.thingTypeName) {
            console.log(` Removing Thing Type: ${desc.thingTypeName}`);
            await iot.updateThing({
                thingName,
                removeThingType: true,
            })
                .promise();
        }
    }
    catch (err) {
        console.warn(" Thing Type removal warning:", err.message);
    }
    // --------------------------------------------------------
    // 2️⃣ DELETE SHADOW
    // --------------------------------------------------------
    try {
        await iotData.deleteThingShadow({ thingName }).promise();
        console.log(" Shadow deleted");
    }
    catch (err) {
        if (err.statusCode !== 404) {
            console.warn(" Shadow delete failed:", err.message);
        }
    }
    // --------------------------------------------------------
    // 3️⃣ DETACH CERTIFICATES
    // --------------------------------------------------------
    const principalsResp = await iot
        .listThingPrincipals({ thingName })
        .promise();
    const principals = principalsResp.principals || [];
    for (const principal of principals) {
        const certId = principal.split("/").pop();
        console.log(` Detaching certificate: ${certId}`);
        // Detach cert from thing
        await iot
            .detachThingPrincipal({
            thingName,
            principal,
        })
            .promise();
        // --------------------------------------------------------
        // 4️⃣ DETACH POLICIES
        // --------------------------------------------------------
        const polResp = await iot
            .listAttachedPolicies({ target: principal })
            .promise();
        for (const p of polResp.policies || []) {
            console.log(`  Detaching policy: ${p.policyName}`);
            await iot
                .detachPolicy({
                policyName: p.policyName,
                target: principal,
            })
                .promise();
        }
        // --------------------------------------------------------
        // 5️⃣ DISABLE CERTIFICATE
        // --------------------------------------------------------
        console.log(`  Disabling certificate ${certId}`);
        await iot
            .updateCertificate({
            certificateId: certId,
            newStatus: "INACTIVE",
        })
            .promise();
        // --------------------------------------------------------
        // 6️⃣ DELETE CERTIFICATE
        // --------------------------------------------------------
        console.log(`  Deleting certificate: ${certId}`);
        await iot
            .deleteCertificate({
            certificateId: certId,
            forceDelete: true,
        })
            .promise();
    }
    // --------------------------------------------------------
    // 7️⃣ WAIT FOR AWS PROPAGATION (retry principal detachment)
    // --------------------------------------------------------
    async function waitForFullyDetached(retries = 10) {
        for (let i = 1; i <= retries; i++) {
            const res = await iot.listThingPrincipals({ thingName }).promise();
            const still = res.principals || [];
            if (still.length === 0) {
                console.log(` Principals fully detached after ${i} check(s)`);
                return true;
            }
            console.log(` Principals still attached (retry ${i}/${retries}):`, still);
            await new Promise((r) => setTimeout(r, 500)); // wait 0.5s
        }
        return false;
    }
    const detached = await waitForFullyDetached();
    if (!detached) {
        console.error(`❌ Cannot delete ${thingName}: principals still attached after retries`);
        return;
    }
    // --------------------------------------------------------
    // 8️⃣ DELETE THING (FINAL)
    // --------------------------------------------------------
    try {
        await iot.deleteThing({ thingName }).promise();
        console.log(`✔ Thing successfully deleted: ${thingName}`);
    }
    catch (err) {
        console.error(`❌ Thing deletion failed: ${err.message}`);
    }
}
//# sourceMappingURL=delete-thing.js.map