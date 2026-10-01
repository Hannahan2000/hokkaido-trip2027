import { Component } from '@angular/core';

interface Flight {
  date: string;
  flightNo: string;
  depTime: string;
  depAirport: string;
  depTerminal: string;
  arrTime: string;
  arrAirport: string;
  arrTerminal: string;
}

@Component({
  selector: 'app-flight',
  templateUrl: './flight.component.html',
  styleUrls: ['./flight.component.scss']
})
export class FlightComponent {
  // 去程資料：台北 -> 釜山 -> 札幌
  outboundFlights: Flight[] = [
    { date: '2027/03/05 (五)', flightNo: 'LJ578', depTime: '02:40', depAirport: '台北桃園 TPE', depTerminal: 'T1', arrTime: '06:10', arrAirport: '釜山 PUS', arrTerminal: 'T1' },
    { date: '2027/03/05 (五)', flightNo: 'LJ527', depTime: '13:50', depAirport: '釜山 PUS', depTerminal: 'T1', arrTime: '16:10', arrAirport: '札幌新千歲 CTS', arrTerminal: 'T1' }
  ];

  // 回程資料：札幌 -> 釜山 -> 台北
  inboundFlights: Flight[] = [
    { date: '2027/03/13 (六)', flightNo: 'LJ528', depTime: '17:10', depAirport: '札幌新千歲 CTS', depTerminal: 'T1', arrTime: '19:55', arrAirport: '釜山 PUS', arrTerminal: 'T1' },
    { date: '2027/03/13 (六)', flightNo: 'LJ577', depTime: '21:50', depAirport: '釜山 PUS', depTerminal: 'T1', arrTime: '23:40', arrAirport: '台北桃園 TPE', arrTerminal: 'T1' }
  ];
}
