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
      
      if (length < keep_minimum_runs) {
        //don't do anything if less runs than minimum to keep
        break;
      }
      else {
        
        const isFirstPage = page_number == 1
        var index = isFirstPage ? keep_minimum_runs : 0
        for (index = 0; index < filteredRuns.length; index++) {

          core.debug(`run id=${filteredRuns[index].id} status=${filteredRuns[index].status}`)

          if(filteredRuns[index].status !== "completed") {
            console.log(`👻 Skipped workflow run ${response.data.workflow_runs[index].id} is in ${response.data.workflow_runs[index].status} state`);
            continue;            
          }
          
          del_runs.push(filteredRuns[index].id);
        }
      }
      
      if (length < 100) {
        //dont try another page if data doesn't fill the current page
        break;
      }
      page_number++;
    }
    
    if (del_runs.length < 1) {
      console.log(`No workflow runs need to be deleted.`);
    }
    else {
      for (index = 0; index < del_runs.length; index++) {
        // Execute the API "Delete a workflow run", see 'https://octokit.github.io/rest.js/v18#actions-delete-workflow-run'
        const run_id = del_runs[index];

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
