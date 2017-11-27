var AWS = require('aws-sdk');
var async = require('async');
var helpers = require(__dirname + '/../../helpers');

module.exports = function(AWSConfig, collection, callback) {
	var iam = new AWS.IAM(AWSConfig);

	if (!collection.iam ||
		!collection.iam.listGroups ||
		!collection.iam.listGroups[AWSConfig.region] ||
		!collection.iam.listGroups[AWSConfig.region].data) return callback();

	async.eachLimit(collection.iam.listGroups[AWSConfig.region].data, 10, function(group, cb){
		// Loop through each policy for that group
		if (!group.GroupName || !collection.iam ||
			!collection.iam.listGroupPolicies ||
			!collection.iam.listGroupPolicies[AWSConfig.region] ||
			!collection.iam.listGroupPolicies[AWSConfig.region][group.GroupName] ||
			!collection.iam.listGroupPolicies[AWSConfig.region][group.GroupName].data ||
			!collection.iam.listGroupPolicies[AWSConfig.region][group.GroupName].data.PolicyNames) {
			return cb();
		}

		collection.iam.getGroupPolicy[AWSConfig.region][group.GroupName] = {};

		async.each(collection.iam.listGroupPolicies[AWSConfig.region][group.GroupName].data.PolicyNames, function(policyName, pCb){
			collection.iam.getGroupPolicy[AWSConfig.region][group.GroupName][policyName] = {};

			// Make the policy call
			iam.getGroupPolicy({
				PolicyName: policyName,
				GroupName: group.GroupName
			}, function(err, data){
				if (err) {
					collection.iam.getGroupPolicy[AWSConfig.region][group.GroupName][policyName].err = err;
				}

				collection.iam.getGroupPolicy[AWSConfig.region][group.GroupName][policyName].data = data;
				pCb();
			});
		}, function(){
			cb();
		});
	}, function(){
		callback();
	});
};