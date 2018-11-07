'use strict';

const df = require('dateformat');
const sort = require('../utils/sort.js');
const log = require('../utils/log.js');
const finish = require('../utils/finish.js');
const parseFilter = require('../utils/filter.js');
const config = require('../utils/config.js');


/**
 * This command will display all of the User's tasks sorted first by list,
 * then completed status, then priority, then due date
 */
function action(args, env) {
  let filter = parseFilter(args.length > 0 ? args[0].join(' ') : '');

  // Get the authenticated User
  config.user(function(user) {

    // Start Spinner
    log.spinner.start("Getting Tasks...");

    // Get User Tasks
    user.tasks.get(filter, function (err, tasks) {
      if ( err ) {
        log.spinner.error("Could not get tasks (" + err.msg + ")");
        return finish();
      }
      else if ( tasks.length === 0 ) {
        log.spinner.error("No tasks returned");
        return finish();
      }
      log.spinner.stop();

      // Get Display Styles
      let styles = config.get().styles;

      // Get max task number
      tasks.sort(sort.tasks.index);
      let MAX_INDEX = tasks[tasks.length - 1].index;

      // Sort Tasks
      tasks.sort(sort.tasks.ls);

      // Last List Name
      let listname = "";

      // Parse each task
      for ( let i = 0; i < tasks.length; i++ ) {
        let task = tasks[i];


        // ==== PRINT LIST NAME ==== //

        // Print New List Name
        if ( task._list.name !== listname ) {
          if ( listname !== "" ) {
            log();
          }
          listname = task._list.name;
          for ( let i = 0; i < MAX_INDEX.toString().length + 1; i++ ) {
            log(' ', false);
          }
          log.style(listname, styles.list, true);
        }


        // ==== PRINT TASK INFORMATION ==== //

        // Print Task Index
        log.style(_pad(task.index, MAX_INDEX), styles.index);
        log.style('| ');

        // Add the Task Priority
        let namestyle = '';
        if ( !task.completed ) {
          namestyle = styles.priority[task.priority.toString()];
          if ( task.priority === 0 ) {
            log.style('|    ');
          }
          else {
            log.style('(' + task.priority + ')', namestyle);
            log.style('| ');
          }
        }
        else {
          namestyle = styles.completed;
          log.style(' ');
          log.style('x', namestyle);
          log.style('  ');
        }

        // Add the Task Name
        log.style('| ');
        log.style(task.name, namestyle);

        // Print Note Indicators
        let notestyle = task.isCompleted ? styles.completed : styles.notes;
        for ( let i = 0; i < task.notes.length; i++ ) {
          log.style('*', notestyle);
        }

        // Print Tags
        let tagstyle = task.isCompleted ? styles.completed : styles.tags;
        for ( let i = 0; i < task.tags.length; i++ ) {
          log.style(' ');
          log.style('#' + task.tags[i], tagstyle);
        }

        // Print Due Date / Completed Date
        if ( !task.isCompleted ) {
          if ( task.due ) {
            log.style(' ');
            log.style('|', styles.due);
            log.style(' ');
            log.style(df(task.due, config.get().dateformat), styles.due);
          }
        }
        else {
          if ( task.completed ) {
            log.style(' ');
            log.style('x', styles.completed);
            log.style(' ');
            log.style(df(task.completed, config.get().dateformat), styles.completed);
          }
        }

        // Finish line
        log('');

      }

      // Finish
      return finish();

    });

  });

}


/**
 * Pad the Index number with leading 0s
 * @param index Task Index Number
 * @param maxIndex Max Task Index
 * @returns {string}
 * @private
 */
function _pad(index, maxIndex) {
  let max = maxIndex.toString().length;
  let digits = index.toString().length;
  let delta = max - digits;
  for ( let i = 0; i < delta; i++ ) {
    index = '0' + index;
  }
  return index;
}



module.exports = {
  command: 'ls [filter...]',
  description: 'List all tasks sorted first by list then by priority',
  action: action
};
