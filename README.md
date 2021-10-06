# delete-oldest-workflow-runs
The GitHub action to deletes all workflow runs before the specified number to keep (keep_minimum_runs). This action (written in JavaScript) wraps two Workflow Runs API:
* [**List repository workflows**](https://docs.github.com/en/free-pro-team@latest/rest/reference/actions#list-repository-workflows) -- Lists the workflows in a repository.

* [**List workflow runs**](https://docs.github.com/en/free-pro-team@latest/rest/reference/actions#list-workflow-runs) -- List all workflow runs for a workflow.

* [**Delete a workflow run**](https://docs.github.com/en/free-pro-team@latest/rest/reference/actions#delete-a-workflow-run) -- Delete a specific workflow run.


## Inputs
### 1. `token`
#### Required: YES
#### Default: `${{ github.token }}`
The token used to authenticate.
* If the workflow runs are in the current repository where the action is running, using **`github.token`** is OK. More details, see the [**`GITHUB_TOKEN`**](https://docs.github.com/en/free-pro-team@latest/actions/reference/authentication-in-a-workflow).
* If the workflow runs are in another repository, you need to use a personal access token (PAT) that must have the **`repo`** scope. More details, see "[Creating a personal access token](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token)".

### 2. `repository`
#### Required: YES
#### Default: `${{ github.repository }}`
The name of the repository where the workflow runs are on

### 3. `keep_minimum_runs`
#### Required: YES
#### Default: 6
The minimum runs to keep for each workflow.
##

### 4. `workflow_name`
#### Required: YES
#### Default: ""
The minimum runs to keep for each workflow.
##

### In manual triggered workflow, see [workflow_dispatch event](https://docs.github.com/en/free-pro-team@latest/actions/reference/events-that-trigger-workflows#workflow_dispatch).
> In this way, you can manually trigger the workflow at any time to delete old workflow runs. <br/>
```yaml
name: Delete old workflow for specific work flow
on:
  workflow_dispatch:
    inputs:
      minimumRunsToKeep:
        description: 'Number of workflow runs to keep'
        required: true
        default: 10
      workflowName:
        description: 'Name of workflow to delete from'
        required: true
        default: 'Builds'

jobs:
  del_runs:
    runs-on: ubuntu-latest
    steps:
      - name: Delete workflow runs
        uses: mwigginsdev/delete-oldest-workflow-runs@main
        with:
          token: ${{ secrets.AUTH_PAT }}
          repository: ${{ github.repository }}
          keep_minimum_runs: ${{ github.event.inputs.minimumRunsToKeep }}
          workflow_name: ${{ github.event.inputs.workflowName }}
```
##

## License
The scripts and documentation in this project are released under the [MIT License](https://github.com/Mattraks/delete-workflow-runs/blob/main/LICENSE).
##
