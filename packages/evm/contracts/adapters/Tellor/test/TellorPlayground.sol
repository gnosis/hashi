// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract TellorPlayground {
    // Storage
    mapping(bytes32 => mapping(uint256 => bool)) public isDisputed; //queryId -> timestamp -> value
    mapping(bytes32 => mapping(uint256 => address)) public reporterByTimestamp;
    mapping(address => StakeInfo) public stakerDetails; //mapping from a persons address to their staking info
    mapping(bytes32 => uint256[]) public timestamps;
    mapping(bytes32 => mapping(uint256 => bytes)) public values; //queryId -> timestamp -> value
    mapping(bytes32 => uint256[]) public voteRounds;

    uint256 public voteCount;
    // Structs
    struct StakeInfo {
        uint256 startDate; //stake start date
        uint256 stakedBalance; // staked balance
        uint256 lockedBalance; // amount locked for withdrawal
        uint256 reporterLastTimestamp; // timestamp of reporter's last reported value
        uint256 reportsSubmitted; // total number of reports submitted by reporter
    }

    // Functions
    /**
     * @dev A mock function to submit a value to be read without reporter staking needed
     * @param _queryId the ID to associate the value to
     * @param _value the value for the queryId
     * @param _nonce the current value count for the query id
     * @param _queryData the data used by reporters to fulfill the data query
     */
    // slither-disable-next-line timestamp
    function submitValue(bytes32 _queryId, bytes calldata _value, uint256 _nonce, bytes memory _queryData) external {
        require(keccak256(_value) != keccak256(""), "value must be submitted");
        require(_nonce == timestamps[_queryId].length || _nonce == 0, "nonce must match timestamp index");
        require(_queryId == keccak256(_queryData) || uint256(_queryId) <= 100, "id must be hash of bytes data");
        values[_queryId][block.timestamp] = _value;
        timestamps[_queryId].push(block.timestamp);
        reporterByTimestamp[_queryId][block.timestamp] = msg.sender;
        stakerDetails[msg.sender].reporterLastTimestamp = block.timestamp;
        stakerDetails[msg.sender].reportsSubmitted++;
    }

    /**
     * @dev A mock function to create a dispute
     * @param _queryId The tellorId to be disputed
     * @param _timestamp the timestamp of the value to be disputed
     */
    function beginDispute(bytes32 _queryId, uint256 _timestamp) external {
        values[_queryId][_timestamp] = bytes("");
        isDisputed[_queryId][_timestamp] = true;
        voteCount++;
        voteRounds[keccak256(abi.encodePacked(_queryId, _timestamp))].push(voteCount);
    }

    /**
     * @dev Retrieves the latest value for the queryId before the specified timestamp
     * @param _queryId is the queryId to look up the value for
     * @param _timestamp before which to search for latest value
     * @return _ifRetrieve bool true if able to retrieve a non-zero value
     * @return _value the value retrieved
     * @return _timestampRetrieved the value's timestamp
     */
    function getDataBefore(
        bytes32 _queryId,
        uint256 _timestamp
    ) external view returns (bool _ifRetrieve, bytes memory _value, uint256 _timestampRetrieved) {
        (bool _found, uint256 _index) = getIndexForDataBefore(_queryId, _timestamp);
        if (!_found) return (false, bytes(""), 0);
        _timestampRetrieved = getTimestampbyQueryIdandIndex(_queryId, _index);
        _value = values[_queryId][_timestampRetrieved];
        return (true, _value, _timestampRetrieved);
    }

    /**
     * @dev Retrieves latest array index of data before the specified timestamp for the queryId
     * @param _queryId is the queryId to look up the index for
     * @param _timestamp is the timestamp before which to search for the latest index
     * @return _found whether the index was found
     * @return _index the latest index found before the specified timestamp
     */
    // solhint-disable-next-line code-complexity
    function getIndexForDataBefore(
        bytes32 _queryId,
        uint256 _timestamp
    ) public view returns (bool _found, uint256 _index) {
        uint256 _count = getNewValueCountbyQueryId(_queryId);
        if (_count > 0) {
            uint256 _middle;
            uint256 _start = 0;
            uint256 _end = _count - 1;
            uint256 _time;
            //Checking Boundaries to short-circuit the algorithm
            _time = getTimestampbyQueryIdandIndex(_queryId, _start);
            if (_time >= _timestamp) return (false, 0);
            _time = getTimestampbyQueryIdandIndex(_queryId, _end);
            if (_time < _timestamp) {
                while (isInDispute(_queryId, _time) && _end > 0) {
                    _end--;
                    _time = getTimestampbyQueryIdandIndex(_queryId, _end);
                }
                if (_end == 0 && isInDispute(_queryId, _time)) {
                    return (false, 0);
                }
                return (true, _end);
            }
            //Since the value is within our boundaries, do a binary search
            while (true) {
                _middle = (_end - _start) / 2 + 1 + _start;
                _time = getTimestampbyQueryIdandIndex(_queryId, _middle);
                if (_time < _timestamp) {
                    //get immediate next value
                    uint256 _nextTime = getTimestampbyQueryIdandIndex(_queryId, _middle + 1);
                    if (_nextTime >= _timestamp) {
                        if (!isInDispute(_queryId, _time)) {
                            // _time is correct
                            return (true, _middle);
                        } else {
                            // iterate backwards until we find a non-disputed value
                            while (isInDispute(_queryId, _time) && _middle > 0) {
                                _middle--;
                                _time = getTimestampbyQueryIdandIndex(_queryId, _middle);
                            }
                            if (_middle == 0 && isInDispute(_queryId, _time)) {
                                return (false, 0);
                            }
                            // _time is correct
                            return (true, _middle);
                        }
                    } else {
                        //look from middle + 1(next value) to end
                        _start = _middle + 1;
                    }
                } else {
                    uint256 _prevTime = getTimestampbyQueryIdandIndex(_queryId, _middle - 1);
                    if (_prevTime < _timestamp) {
                        if (!isInDispute(_queryId, _prevTime)) {
                            // _prevTime is correct
                            return (true, _middle - 1);
                        } else {
                            // iterate backwards until we find a non-disputed value
                            _middle--;
                            while (isInDispute(_queryId, _prevTime) && _middle > 0) {
                                _middle--;
                                _prevTime = getTimestampbyQueryIdandIndex(_queryId, _middle);
                            }
                            if (_middle == 0 && isInDispute(_queryId, _prevTime)) {
                                return (false, 0);
                            }
                            // _prevtime is correct
                            return (true, _middle);
                        }
                    } else {
                        //look from start to middle -1(prev value)
                        _end = _middle - 1;
                    }
                }
            }
        }
        return (false, 0);
    }

    /**
     * @dev Counts the number of values that have been submitted for a given ID
     * @param _queryId the ID to look up
     * @return uint256 count of the number of values received for the queryId
     */
    function getNewValueCountbyQueryId(bytes32 _queryId) public view returns (uint256) {
        return timestamps[_queryId].length;
    }

    /**
     * @dev Gets the timestamp for the value based on their index
     * @param _queryId is the queryId to look up
     * @param _index is the value index to look up
     * @return uint256 timestamp
     */
    function getTimestampbyQueryIdandIndex(bytes32 _queryId, uint256 _index) public view returns (uint256) {
        uint256 _len = timestamps[_queryId].length;
        if (_len == 0 || _len <= _index) return 0;
        return timestamps[_queryId][_index];
    }

    /**
     * @dev Returns whether a given value is disputed
     * @param _queryId unique ID of the data feed
     * @param _timestamp timestamp of the value
     * @return bool whether the value is disputed
     */
    function isInDispute(bytes32 _queryId, uint256 _timestamp) public view returns (bool) {
        return isDisputed[_queryId][_timestamp];
    }
}
