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
  
  
export const diskQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT TimeCreated as time, u.XLogin, ur.DiskSpace
        FROM UserRecord ur
        JOIN User u ON u.ID = ur.UserID
        JOIN Machine m ON MachineMac = MAC
        WHERE ur.DiskSpace IS NOT NULL AND m.Name = '${text}' AND u.xlogin IN ($user) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});

export const filesQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT TimeCreated as time, u.XLogin, ur.Files
        FROM UserRecord ur
        JOIN User u ON u.ID = ur.UserID
        JOIN Machine m ON MachineMac = MAC
        WHERE ur.Files IS NOT NULL AND m.Name = '${text}' AND u.xlogin IN ($user) AND $__timeFilter(TimeCreated) 
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
