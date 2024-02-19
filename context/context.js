import React, { useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import JSBI from "jsbi";
import Web3Modal from "web3modal"


//INTERNAL IMPORT Uniswap
import { SwapRouter } from "@uniswap/universal-router-sdk";
import {
    TradeType,
    Ether,
    Token,
    CurrencyAmount,
    Percent,
} from "@uniswap/sdk-core";
import { Trade as V2Trade } from "@uniswap/v2-sdk";
import { Pool, nearestUsableTick, TickMatch, TICK_SPACINGS, FeeAmount, Trade as V3Trade, Route as RouteV3, TickMath } from "@uniswap/v3-sdk";

import { MixedRouteTrade, Trade as RouterTrade } from "@uniswap/router-sdk";
import IUniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";


//INTERNAL IMPORT
import { ERC20_ABI, web3Provider, CONNECTING_CONTRACT } from "./constants";
import { shortenAddress, parseErrorMsg } from "../utils/index";

export const CONTEXT = React.createContext();

export const PROVIDER = ({ children }) => {
    const TOKEN_SWAP = "TOKEN SWAP DAPP";
    const [loader, setLoader] = useState(false);
    const [address, setAddress] = useState("");
    const [chainID, setChainID] = useState()
    
    //NOTIFICATION
    const notifyError = (msg) => toast.error(msg, { duration: 4000 });
    const notifySuccess = (msg) => toast.success(msg, { duration: 4000 });

    //CONNECT WALLET FUNCTION
    const connect = async () => {
        try {
            if (!window.ethereum) return notifyError('Install MetaMask');

            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            if (accounts.length) {
                setAddress(accounts[0]);
            } else {
                notifyError("Sorry, you have no account");
            }

            const provider = await web3Provider();
            const network = await provider.getNetwork();
            setChainID(network.chainId);
        } catch (error) {
            const errorMsg = parseErrorMsg(error);
            notifyError(errorMsg);
            console.log(error);
        }
    };

    //LOAD TOKEN DATA 
    const LOAD_TOKEN = async (token) => {
        try {
            const tokenDetail = await CONNECTING_CONTRACT(token);
        } catch (error) {
            const errorMsg = parseErrorMsg(error);
            notifyError(errorMsg);
            console.log(error);
        }
    }

    //INTERNAL FUNCTION
    async function getPool(tokenA, tokenB, feeAmount, provider) {
        const [token0, token1] = tokenA.sortsBefore(tokenB)
            ? [tokenA, tokenB]
            : [tokenB, tokenA];
        
        const poolAddress = Pool.getAddress(token0, token1, feeAmount);

        const contract = new ethers.Contract(poolAddress, IUniswapV3Pool, provider);

        let liquidity = await contract.liquidity();

        let { sqrtPriceX96, tick } = await contract.slot0();

        liquidity = JSBI.BigInt(liquidity.toString());
        sqrtPriceX96 = JSBI.BigInt(sqrtPriceX96.toString());

        return new Pool(token0, token1, feeAmount, sqrtPriceX96, liquidity, tick, [
            index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
            
        ])


    }
};




