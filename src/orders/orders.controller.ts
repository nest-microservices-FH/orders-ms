import { Controller, NotImplementedException, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderPaginatioDto } from './dto/order-pagination.dto';
import { ChangeSOrderStatusDto } from './dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload()orderPaginatioDto:OrderPaginatioDto) {
    return this.ordersService.findAll(orderPaginatioDto);
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload('id',ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('changeOrderStatus')
  changeOrderStatus(@Payload() changeSOrderStatusDto:ChangeSOrderStatusDto){
    return this.ordersService.changeOrderStatus(changeSOrderStatusDto)
    // throw new NotImplementedException()
  }




  // @MessagePattern('updateOrder')
  // update(@Payload() updateOrderDto: UpdateOrderDto) {
  //   return this.ordersService.update(updateOrderDto.id, updateOrderDto);
  // }

  // @MessagePattern('removeOrder')
  // remove(@Payload() id: number) {
  //   return this.ordersService.remove(id);
  // }
}
