//Calls the AMBHeaderReporter reportHeaders() method every x hours

// require('dotenv').config();
// const { ethers } = require('ethers');
// const cron = require('node-cron');

import { createPublicClient, http, createWalletClient } from 'viem'
import { mainnet, goerli, gnosis } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts' 
import 'dotenv/config'
import 'node-cron'

const walletClient = createWalletClient({
    chain: goerli,
    transport: http()
})
const publicClient = createPublicClient({
    chain: goerli,
    transport: http()
})


const account = privateKeyToAccount(process.env.PRIVATE_KEY) 
// Create an instance of the contract
const contractAddress = process.env.AMB_REPORTER_CONTRACT_ADDRESS;

const contractABI = require('../ABIs/ambReporterContractABI.json');



// Set up the cron job to call the Solidity method every 1 hour. 24h -> '0 0 * * *'
cron.schedule('0 * * * *', async () => {
    try {
        // Get the latest block number
        const blockNumber = await publicClient.getBlockNumber();
        console.log('Latest block number:', blockNumber);

        amb_adapter = process.env.AMB_ADAPTER;
        gas = process.env.GAS;

        // Call the reportHeaders method using the contract instance
        const {request} = await publicClient.simulateContract({
            account, // calling from account
            address: contractAddress,
            abi: contractABI,
            functionName: 'reportHeaders',
            args: [[blockNumber], amb_adapter, gas],
        })
        ;
        const txHash = await walletClient.writeContract(request);
        console.log('Solidity method called successfully:', txHash);
    } catch (error) {
        console.error('Error calling Solidity method:', error);
    }
});

console.log('Cron job scheduled to call the Solidity method every 1 hour.');