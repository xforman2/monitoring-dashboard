import { QueryVariable, SceneDataTransformer, SceneQueryRunner } from "@grafana/scenes";
import { SQL_DATASOURCE } from "../../constants";

export const users = new QueryVariable({
    name: 'user',
    label: 'User Name',
    datasource: SQL_DATASOURCE,
    query: "SELECT xlogin from User",
    sort: 1,
    isMulti: true,
    includeAll: true
});
  
  
export const pcpuQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT TimeCreated as time, ur.PCPU, u.FullName
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        JOIN Machine m ON MachineMac = MAC
        WHERE  m.Name = '${text}' AND u.xlogin IN ($user) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});

export const cpuTimeQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT TimeCreated as time, TIME_TO_SEC(ur.CPUTime) as CPUTime, u.FullName
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        JOIN Machine m ON MachineMac = MAC
        WHERE  m.Name = '${text}' AND u.xlogin IN ($user) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});

export const highCpuTimeQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT TimeCreated as time, ur.HighCpuTime, u.FullName
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        JOIN Machine m ON MachineMac = MAC
        WHERE  m.Name = '${text}' AND u.xlogin IN ($user) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});

export const processCountQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT TimeCreated as time, ur.ProcessCount, u.FullName
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        JOIN Machine m ON MachineMac = MAC
        WHERE  m.Name = '${text}' AND u.xlogin IN ($user) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});

export const sleepingProcessesQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT TimeCreated as time, ur.IOSleeping, u.FullName
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        JOIN Machine m ON MachineMac = MAC
        WHERE  m.Name = '${text}' AND u.xlogin IN ($user) AND $__timeFilter(TimeCreated) 
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
