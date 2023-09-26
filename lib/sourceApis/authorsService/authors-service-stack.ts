import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AuthorsServiceApiStack } from "./authors-service-api-stack";
import { Role } from "aws-cdk-lib/aws-iam";
import { GraphqlApi, SourceApiAssociation, MergeType } from "aws-cdk-lib/aws-appsync";
import {
    SourceApiAssociationMergeOperation,
    SourceApiAssociationMergeOperationProvider
} from "../../constructs/source-api-association-merge";

export class AuthorsServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StageProps) {
        super(scope, id);

        const authorsServiceApiStack = new AuthorsServiceApiStack(this, 'AuthorsServiceApiStack', props);

        const mergedApiExecutionRole = Role.fromRoleArn(this, 'MergedApiExecutionRole',
            cdk.Fn.importValue(`${props.stageName}-BookReviewsMergedApiExecutionRoleArn`))

        const mergedApiArn = cdk.Fn.importValue(`${props.stageName}-BookReviewsMergedApiArn`)
        const mergedApiId = cdk.Fn.importValue(`${props.stageName}-BookReviewsMergedApiId`)

        const mergedApi = GraphqlApi.fromGraphqlApiAttributes(this, 'MergedApi', {
            graphqlApiArn: mergedApiArn,
            graphqlApiId: mergedApiId,
        });

        // Associates this api to the BookReviewsMergedApi
        const sourceApiAssociation = new SourceApiAssociation(this, 'BooksSourceApiAssociation', {
            sourceApi: authorsServiceApiStack.authorsApi,
            mergedApi: mergedApi,
            mergedApiExecutionRole: mergedApiExecutionRole,
            mergeType: MergeType.MANUAL_MERGE,
        });

        const schemaMergeProvider = new SourceApiAssociationMergeOperationProvider(this, 'MergeProvider');

        const manualMergeHandler = new SourceApiAssociationMergeOperation(this, 'ManualMergeOperation', {
            sourceApiAssociation: sourceApiAssociation,
            mergeOperationProvider: schemaMergeProvider,
            alwaysMergeOnStackUpdate: true,
        });

        manualMergeHandler.node.addDependency(authorsServiceApiStack);
    }
}
