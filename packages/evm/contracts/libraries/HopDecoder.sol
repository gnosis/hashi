pragma solidity ^0.8.20;

import { IAdapter } from "../interfaces/IAdapter.sol";
import { IReporter } from "../interfaces/IReporter.sol";

library HopDecoder {
    function decodeCurrentHop(
        bytes calldata data
    )
        internal
        pure
        returns (
            bytes4 magic,
            uint8 hopsNonce,
            uint8 hopsCount,
            bytes8 chainProtocol,
            uint256 chainId,
            address receiver,
            uint256 expectedSourceChainId,
            address expectedSender,
            uint32 expectedThreshold,
            bytes32 expectedAdaptersHash,
            uint32 nextThreshold,
            IReporter[] memory nextReporters,
            IAdapter[] memory nextAdapters,
            bytes memory message
        )
    {
        magic = bytes4(data[:4]);
        hopsNonce = uint8(bytes1(data[4:5]));
        hopsCount = uint8(bytes1(data[5:6]));

        uint32 hopBytesToSkip = 0;
        for (uint256 k = 0; k < hopsNonce; ) {
            hopBytesToSkip += uint32(bytes4(data[6 + k * 4:6 + (k * 4) + 4]));
            unchecked {
                ++k;
            }
        }

        uint256 hopStart = 6 + hopBytesToSkip + ((hopsNonce + 1) * 4);
        uint256 a = hopStart + 8;
        uint256 b = hopStart + 24;
        uint256 c = hopStart + 56;
        uint256 d = hopStart + 72;
        uint256 e = hopStart + 104;
        uint256 f = hopStart + 108;
        uint256 g = hopStart + 140;
        uint256 h = hopStart + 144;
        uint256 i = hopStart + 148;

        chainProtocol = bytes8(data[hopStart:a]);
        chainId = uint128(bytes16(data[a:b]));
        receiver = address(uint160(uint256(bytes32(data[b:c]))));
        expectedSourceChainId = uint128(bytes16(data[c:d]));
        expectedSender = address(uint160(uint256(bytes32(data[d:e]))));
        expectedThreshold = uint32(bytes4(data[e:f]));
        expectedAdaptersHash = bytes32(data[f:g]);
        nextThreshold = uint32(bytes4(data[g:h]));

        uint32 nextReportersLength = uint32(bytes4(data[h:i]));
        nextReporters = new IReporter[](nextReportersLength);
        for (uint256 k = 0; k < nextReportersLength; ) {
            nextReporters[k] = IReporter(address(uint160(uint256(bytes32(data[i + (k * 32):i + (k * 32) + 32])))));
            unchecked {
                ++k;
            }
        }

        uint256 l = i + (nextReportersLength * 32);
        uint256 m = l + 4;
        uint32 nextAdaptersLength = uint32(bytes4(data[l:m]));
        nextAdapters = new IAdapter[](nextAdaptersLength);
        for (uint256 k = 0; k < nextAdaptersLength; ) {
            nextAdapters[k] = IAdapter(address(uint160(uint256(bytes32(data[m + (k * 32):m + (k * 32) + 32])))));
            unchecked {
                ++k;
            }
        }

        uint256 n = m + (nextAdaptersLength * 32);
        uint256 o = n + 3;
        uint24 messageLength = uint24(bytes3(data[n:o]));
        message = data[o:o + messageLength];
    }
}
