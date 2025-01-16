// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;


interface ITellor {
    /// @notice Retrieves the data corresponding to a given queryId before a specified timestamp
    /// Specs of how query ids are generated can be found here: https://github.com/tellor-io/dataSpecs
    /// @param _queryId The ID of the query for which data is requested
    /// @param _timestamp The timestamp before which data is to be retrieved
    /// @return _available Indicates whether data is available or not
    /// @return _value The data retrieved for the query in bytes
    /// @return _timestampRetrieved The timestamp when the data was submitted
    function getDataBefore(
        bytes32 _queryId,
        uint256 _timestamp
    ) external view returns (bool _available, bytes memory _value, uint256 _timestampRetrieved);

}