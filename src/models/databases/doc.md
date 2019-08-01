Things to note:

MySQLDatabase class

    - insert, update, delete methods returns [err, resp]
      where resp is of the form { data: null, metadata: { ... }}

    - get, getFirst methods returns [err, resp]
      where resp is of the form { data: null | [ ... ], metadata: null }
      resp.data will be null or [] depending on the sql select result
      if select statement has no results, it will return null

CassandraDB class
    
    - follows the same return format as MySQLDatabase