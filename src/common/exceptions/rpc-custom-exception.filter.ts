import { Catch, RpcExceptionFilter, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)


export class RpcCustomExceptionFilter implements ExceptionFilter{
  catch(exception: RpcException, host: ArgumentsHost) {
    
    const ctx=host.switchToHttp();
    const response=ctx.getResponse();

    const rpcError=exception.getError()
    // console.log(rpcError);

    if (typeof rpcError==='object' && 'status' in rpcError && 'message' in rpcError) {
      const status=isNaN(+rpcError.status)?400: +rpcError.status
      return response.status(status).json(rpcError)
    }
    

    response.status(401).json({
      status:401,
      message:"hello"
    })
    // return throwError(() => exception.getError());
  }
}