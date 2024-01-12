import { QueryVariable, SceneDataTransformer, SceneQueryRunner } from "@grafana/scenes";
import { SQL_DATASOURCE_2 } from "../../constants";

export const users = new QueryVariable({
    name: 'user',
    label: 'User Name',
    datasource: SQL_DATASOURCE_2,
    query: "SELECT login from User",
    sort: 1,
    isMulti: true,
    includeAll: true
});
  
  
export const pcpuQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT TimeCreated as time, ur.PCPU, u.login
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        JOIN Machine m ON MachineId = m.ID
        WHERE  m.Name = '${text}' AND u.login IN ($user) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});

export const cpuTimeQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT TimeCreated as time, TIME_TO_SEC(ur.CPUTime) as CPUTime, u.login
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        JOIN Machine m ON MachineId = m.ID
        WHERE  m.Name = '${text}' AND u.login IN ($user) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});

export const highCpuTimeQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT TimeCreated as time, ur.HighCpuTime, u.login
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        JOIN Machine m ON MachineId = m.ID
        WHERE  m.Name = '${text}' AND u.login IN ($user) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});

export const processCountQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT TimeCreated as time, ur.ProcessCount, u.login
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        JOIN Machine m ON MachineId = m.ID
        WHERE  m.Name = '${text}' AND u.login IN ($user) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});

export const sleepingProcessesQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT TimeCreated as time, ur.IOSleeping, u.login
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        JOIN Machine m ON MachineId = m.ID
        WHERE  m.Name = '${text}' AND u.login IN ($user) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});


export const transformedData = (query: SceneQueryRunner, field: string) => new SceneDataTransformer({
    $data: query,
    transformations: [
        {
        id: 'renameByRegex',
        options: {
            regex: `${field}(.*)`,
            renamePattern: '$1',
        },
        },
        {
        id: "convertFieldType",
        options: {
            conversions: [
            {
                destinationType: "number",
                targetField: `${field}`
            }
            ],
            fields: {}
        }
        }
    ],
});
