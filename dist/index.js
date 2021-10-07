async function run() {
  const core = require("@actions/core");
  try {
    // Fetch all the inputs
    const token = core.getInput('token');
    const repository = core.getInput('repository');
    const keep_minimum_runs = core.getInput('keep_minimum_runs');
    const workflow_name = core.getInput('workflow_name');

    // Split the input 'repository' (format {owner}/{repo}) to be {owner} and {repo}
    const splitRepository = repository.split('/');
    if (splitRepository.length !== 2 || !splitRepository[0] || !splitRepository[1]) {
      throw new Error(`Invalid repository '${repository}'. Expected format {owner}/{repo}.`);
    }
    const repo_owner = splitRepository[0];
    const repo_name = splitRepository[1];
    
    var page_number = 1;
    var del_runs = new Array();
    const { Octokit } = require("@octokit/rest");
    const octokit = new Octokit({ auth: token });

    console.log(`DELETING FROM: ${workflow_name}`);
    console.log(`MINIMUM RUNS TO KEEP: ${keep_minimum_runs}`);
    
    while (true) {
      // Execute the API "List workflow runs for a repository", see 'https://octokit.github.io/rest.js/v18#actions-list-workflow-runs-for-repo'     
      const response = await octokit.actions.listWorkflowRunsForRepo({
        owner: repo_owner,
        repo: repo_name,
        per_page: 100,
        page: page_number
      });
     
      const filteredRuns = response.data.workflow_runs.filter( (run, index, arr) => {
          return run.name == workflow_name
        })
      
      const length = filteredRuns.length;
      
      console.log(`Filtered Runs Length: ${length}`)
      
      const isFirstPage = page_number == 1
      console.log(`isFirstPage: ${isFirstPage}`)
      if (isFirstPage) {
        filteredRuns.splice(0, keep_minimum_runs)
      }
      
      del_runs.push.apply(del_runs, filteredRuns);
      
      console.log(`Runs to delete ${del_runs.length}`)
      
      if (length < 100) {
        //dont try another page if data doesn't fill the current page
        break;
      }
      
      page_number++;
    }
    
    console.log(`preparing to delete`)
    if (del_runs.length < 1) {
      console.log(`No workflow runs need to be deleted.`);
    }
    else {
      console.log(`Deleting ${del_runs.length} runs`)
      for (let i = 0; i < del_runs.length; i++) {
        // Execute the API "Delete a workflow run", see 'https://octokit.github.io/rest.js/v18#actions-delete-workflow-run'
        console.log(`index: ${i}`)
        const run_id = del_runs[i];

        core.debug(`Deleting workflow run ${run_id}`);     

        await octokit.actions.deleteWorkflowRun({
          owner: repo_owner,
          repo: repo_name,
          run_id: run_id
        });

        console.log(`🚀 Delete workflow run ${run_id}`);
      }

      console.log(`✅ ${del_runs.length} workflow runs are deleted.`);
    }
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();
