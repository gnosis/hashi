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

        uint24 messageLength = uint24(bytes3(data[4:7]));
        message = data[7:7 + messageLength];

        uint256 a = 7 + messageLength;
        uint256 b = a + 1;
        uint256 c = b + 1;

        hopsNonce = uint8(bytes1(data[a:b]));
        hopsCount = uint8(bytes1(data[b:c]));

        uint32 hopBytesToSkip = 0;
        for (uint256 k = 0; k < hopsNonce; ) {
            hopBytesToSkip += uint32(bytes4(data[c + k * 4:c + (k * 4) + 4]));
            unchecked {
                ++k;
            }
        }

        uint256 hopStart = c + hopBytesToSkip + ((hopsNonce + 1) * 4);
        uint256 d = hopStart + 8;
        uint256 e = hopStart + 24;
        uint256 f = hopStart + 56;
        uint256 g = hopStart + 72;
        uint256 h = hopStart + 104;
        uint256 i = hopStart + 108;
        uint256 l = hopStart + 140;
        uint256 m = hopStart + 144;
        uint256 n = hopStart + 148;

        chainProtocol = bytes8(data[hopStart:d]);
        chainId = uint128(bytes16(data[d:e]));
        receiver = address(uint160(uint256(bytes32(data[e:f]))));
        expectedSourceChainId = uint128(bytes16(data[f:g]));
        expectedSender = address(uint160(uint256(bytes32(data[g:h]))));
        expectedThreshold = uint32(bytes4(data[h:i]));
        expectedAdaptersHash = bytes32(data[i:l]);
        nextThreshold = uint32(bytes4(data[l:m]));

        uint32 nextReportersLength = uint32(bytes4(data[m:n]));
        nextReporters = new IReporter[](nextReportersLength);
        for (uint256 k = 0; k < nextReportersLength; ) {
            nextReporters[k] = IReporter(address(uint160(uint256(bytes32(data[n + (k * 32):n + (k * 32) + 32])))));
            unchecked {
                ++k;
            }
        }

        uint256 o = n + (nextReportersLength * 32);
        uint256 p = o + 4;
        uint32 nextAdaptersLength = uint32(bytes4(data[o:p]));
        nextAdapters = new IAdapter[](nextAdaptersLength);
        for (uint256 k = 0; k < nextAdaptersLength; ) {
            nextAdapters[k] = IAdapter(address(uint160(uint256(bytes32(data[p + (k * 32):p + (k * 32) + 32])))));
            unchecked {
                ++k;
            }
        }
    }
}
