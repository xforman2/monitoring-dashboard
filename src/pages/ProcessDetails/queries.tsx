import { QueryVariable, SceneDataTransformer, SceneQueryRunner } from "@grafana/scenes";
import { SQL_DATASOURCE_2 } from "../../constants";

export const users = new QueryVariable({
    name: 'user',
    label: 'User Name',
    datasource: SQL_DATASOURCE_2,
    query: "SELECT login from User",
    sort: 1,
    isMulti: false,
    includeAll: false
});
  
  
export const gpuCountQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT UserRecordTimeCreated as time, Command, pe.GpuCount
        FROM ProcessRecord pe
        JOIN User u ON Id = UserId
        JOIN Machine m ON MachineId = m.ID
        WHERE m.Name = '${text}' AND login = '$user' AND $__timeFilter(UserRecordTimeCreated) 
        ORDER BY time`
    }],

});

  
export const nicenessQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT UserRecordTimeCreated as time, Command, pe.Niceness
        FROM ProcessRecord pe
        JOIN User ON Id = UserId
        JOIN Machine m ON MachineId = m.ID
        WHERE m.Name = '${text}' AND login = '$user' AND $__timeFilter(UserRecordTimeCreated) 
        ORDER BY time`
    }],

});
  
export const vramQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT UserRecordTimeCreated as time, Command, pe.OverallGPUVram
        FROM ProcessRecord pe
        JOIN User ON Id = UserId
        JOIN Machine m ON MachineId = m.ID
        WHERE m.Name = '${text}' AND login = '$user' AND $__timeFilter(UserRecordTimeCreated) 
        ORDER BY time`
    }],

});

export const cpuTimeQuery = (text: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT UserRecordTimeCreated as time, Command, TIME_TO_SEC(pe.CPUTime) as CPUTime
        FROM ProcessRecord pe
        JOIN User ON Id = UserId
        JOIN Machine m ON MachineId = m.ID
        WHERE m.Name = '${text}' AND login = '$user' AND $__timeFilter(UserRecordTimeCreated) 
        ORDER BY time`
    }],

});
  


export const transformedData = (query: SceneQueryRunner, field: string) => new SceneDataTransformer({
    $data: query,
    transformations: [
        {
        id: 'renameByRegex',
        options: {
            regex: `${field} (.*)`,
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
