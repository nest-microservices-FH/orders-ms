import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE, PRODUCT_SERVICE } from 'src/config';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderPaginatioDto } from './dto/order-pagination.dto';
import { ChangeSOrderStatusDto } from './dto/change-order-status.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('Orders Service')


  constructor(@Inject(NATS_SERVICE) private readonly productsClient: ClientProxy) {
    super();
  }


  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected')
  }

  async create(createOrderDto: CreateOrderDto) {

    try {
      // Confrimar ids
      const ProductIds = createOrderDto.items.map((item) => item.productId)


      const products: any[] = await firstValueFrom(
        this.productsClient.send({ cmd: 'validate_products' }, ProductIds)

      );

      // return products
      // caluclos valores
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find(producto => producto.id === orderItem.productId).price

        return price * orderItem.quantity

      }, 0)

      const totalItems = createOrderDto.items.reduce((acc, orderitem) => {
        
        return acc + orderitem.quantity

      }, 0)
      // transacicon de base de datos

      const order = await this.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({ price: products.find((product) => product.id === orderItem.productId).price, productoId: orderItem.productId, quantity: orderItem.quantity }))
            }
          }

        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productoId: true,

            }
          }
        }
      })


      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productoId).name
        }))
      }

    } catch (error) {
      throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: "Check Logs" })
    }




  }

  async findAll(orderPaginatioDto: OrderPaginatioDto) {

    const totalPages = await this.order.count({
      where: {
        status: orderPaginatioDto.status
      }
    })
    const currentPage = orderPaginatioDto.page
    const perPage = orderPaginatioDto.limit

    return {
      data: await this.order.findMany({
        skip: (currentPage - 1) * perPage,
        take: perPage,
        where: {
          status: orderPaginatioDto.status
        }
      }),
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil(totalPages / perPage)
      }

    }
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({ where: { id },include:{OrderItem:{select:{
      price:true,
      quantity:true,
      productoId:true
    }}} })

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`
      })
    }

    const productsIds=order.OrderItem.map(item=>item.productoId)

    const products:any[]=await firstValueFrom(
      this.productsClient.send({cmd:"validate_products"},productsIds)
    )
    

    return {...order,OrderItem:order.OrderItem.map((item)=>({...item,name:products.find((product)=>product.id==item.productoId).name}))}

  }
  async changeOrderStatus(changeSOrderStatusDto: ChangeSOrderStatusDto) {
    const { id, status } = changeSOrderStatusDto

    const order = await this.findOne(id);

    if (order.status == status) {
      return order;
    }

    return this.order.update({
      where: { id },
      data: {
        status: status
      }
    })

  }
  // update(id: number, updateOrderDto: UpdateOrderDto) {
  //   return `This action updates a #${id} order`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} order`;
  // }
}
