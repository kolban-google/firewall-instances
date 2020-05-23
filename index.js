/*

Author: kolban@google.com
Date: 2020-05-22

Get the list of all firewall rules;
For each of the firewall rules {
  Get the networkTags for that rule;
  Search for all compute instances that have one or more of those tags;
  List the rule and the associated compute instances that have the tags;
}

*/

const argv = require('yargs')
    .usage('$0 --project projectNum [--vpc vpc-name]')
    .string('projectNum')
    .nargs('projectNum', 1)
    .describe('projectNum', 'Project number to search')
    .demandOption('projectNum')
    .string('vpc')
    .nargs('vpc', 1)
    .describe('vpc', 'The VPC network to use')
    .default('vpc', 'default')
    .help('help')
    .version(false)
    .argv

const projectNumber = argv.projectNum;
const vpcName = argv.vpc;
//console.log(`projectNum: ${projectNumber}, vpc: ${vpcName}`);
const util = require('util');
const {AssetServiceClient} = require('@google-cloud/asset').v1p1beta1;
const Compute = require('@google-cloud/compute');
const computeClient = new Compute();
const assetClient = new AssetServiceClient();

const network = computeClient.network(vpcName);
//console.log("Got the network");


// process an instance of a firewall.  The object passed in has:
//
// * targetTags: Array of string.  May not be present.
// * name: string The name of the firewall.
//
async function processFirewall(firewall) {
    //console.log(`----\nname: ${firewall.name}, targetTags: ${firewall.targetTags}`);

    const firewallResponse = {
        "name": firewall.name
    };

    let query = "";
    // Build query
    if (firewall.targetTags) {
        if (firewall.targetTags.length == 1) {
            // One element
            query = `networkTags: ${firewall.targetTags[0]}`;
        } else {
            let first = true;
            firewall.targetTags.forEach((targetTag) => {
                if (first) {
                    query += `(networkTags: ${targetTag})`;
                    first = false;
                } else {
                    query += ` OR (networkTags: ${targetTag})`;
                }
            });
        }

        // The query variable now contains the query we want to use to search.
        //console.log(`Query: ${query}`);
        const request = {
            //"query": 'networkTags: "xyz"',
            "query": query,
            "scope": `projects/${projectNumber}`,
            "assetTypes": [ "compute.googleapis.com/Instance" ]
        };
        

        // See: https://googleapis.dev/nodejs/asset/latest/google.cloud.asset.v1p1beta1.AssetService.html#searchAllResources1
        const searchResultsRaw = await assetClient.searchAllResources(request);
        const searchResults = searchResultsRaw[0];
        if (searchResults.length > 0) {
            firewallResponse.instances = [];
            searchResults.forEach((computeAsset) => {
                firewallResponse.instances.push(computeAsset.name);
            });
            //console.log(`Got search results!: ${util.inspect(searchResults)}`);
        }
    } else {
        //console.log("No target tags");
    }
    //console.log(`Final result: ${util.inspect(firewallResponse)}`);
    return firewallResponse;
}

function run() {
    //console.log("Getting firewalls")

    network.getFirewalls(null, async (err, firewalls) => {
        //console.log(`Got firewalls`);
        // Data is an array
        const resultList = [];
        const l = firewalls.length;
        for (let i=0; i<l; i++) {
            //const data = element.get();
            //console.log(`metadata: ${JSON.stringify(element.metadata)}`);
            //console.log(util.inspect(element.metadata));
            //console.log("Calling processFirewall");
            const result = await processFirewall(firewalls[i].metadata);
            resultList.push(result);
            //console.log(`${JSON.stringify(element)}`)
        };
        console.log(`${JSON.stringify(resultList)}`);
    });
}

run();