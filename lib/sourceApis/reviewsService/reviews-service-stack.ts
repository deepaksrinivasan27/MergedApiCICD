import * as cdk from "aws-cdk-lib";
import {Construct} from "constructs";
import {MergeType, SourceApiAssociationConstruct} from "../../constructs/source-api-association-construct";
import {ReviewsServiceApiStack} from "./reviews-service-api-stack";
import {Role} from "aws-cdk-lib/aws-iam";

export class ReviewsServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StageProps) {
        super(scope, id, props);

        const reviewsServiceApiStack = new ReviewsServiceApiStack(this, 'ReviewsServiceApiStack', props);

        const mergedApiExecutionRole = Role.fromRoleArn(this, 'MergedApiExecutionRole',
            cdk.Fn.importValue(`${props.stageName}-BookReviewsMergedApiExecutionRoleArn`))

        // Associates this api to the BookReviewsMergedApi
        // This will run a custom resource to merge changes to the Book Reviews Merged API whenever the authors stack is deployed
        const sourceApiAssociation = new SourceApiAssociationConstruct(this, 'SourceApiAssociation', {
            description: "Authors service API which handles the authors metadata in the system.",
            mergeType: MergeType.MANUAL_MERGE,
            mergedApiArn: cdk.Fn.importValue(`${props.stageName}-BookReviewsMergedApiArn`),
            mergedApiId: cdk.Fn.importValue(`${props.stageName}-BookReviewsMergedApiId`),
            sourceApiArn: reviewsServiceApiStack.bookReviewsApi.arn,
            sourceApiId: reviewsServiceApiStack.bookReviewsApi.apiId,
            mergedApiExecutionRole: mergedApiExecutionRole
        });

        sourceApiAssociation.node.addDependency(reviewsServiceApiStack);
    }
}