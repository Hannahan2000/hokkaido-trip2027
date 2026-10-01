import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FlightComponent } from './pages/flight/flight.component';
import { HotelComponent } from './pages/hotel/hotel.component';
import { ItineraryComponent } from './pages/itinerary/itinerary.component';
import { ChecklistComponent } from './pages/checklist/checklist.component';
import { MemoComponent } from './pages/memo/memo.component';

const routes: Routes = [
  { path: 'flight', component: FlightComponent },
  { path: 'hotel', component: HotelComponent },
  { path: 'itinerary', component: ItineraryComponent },
  { path: 'checklist', component: ChecklistComponent },
  { path: 'memo', component: MemoComponent },
  { path: '', redirectTo: '/itinerary', pathMatch: 'full' }, // 預設開啟行程頁
  { path: '**', redirectTo: '/itinerary' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
