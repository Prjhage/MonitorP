/**
 * Simulated geographic regions for API monitoring.
 * latencyOffset (ms) is added to the real measured ping time to simulate
 * network distance from that region to the monitored endpoint.
 */
const REGIONS = [
    { id: 'us-east', name: 'US East', flag: '🇺🇸', latencyOffset: 0 },
    { id: 'eu-west', name: 'EU West', flag: '🇩🇪', latencyOffset: 80 },
    { id: 'ap-southeast', name: 'Asia Pacific', flag: '🇸🇬', latencyOffset: 160 },
    { id: 'sa-east', name: 'S. America', flag: '🇧🇷', latencyOffset: 120 },
    { id: 'au-east', name: 'Australia', flag: '🇦🇺', latencyOffset: 200 },
];

module.exports = REGIONS;
