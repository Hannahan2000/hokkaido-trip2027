import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FlightComponent } from './pages/flight/flight.component';
import { HotelComponent } from './pages/hotel/hotel.component';
import { ItineraryComponent } from './pages/itinerary/itinerary.component';
import { ChecklistComponent } from './pages/checklist/checklist.component';
import { MemoComponent } from './pages/memo/memo.component';
// 1. 引入 DragDropModule
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [
    AppComponent,
    FlightComponent,
    HotelComponent,
    ItineraryComponent,
    ChecklistComponent,
    MemoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DragDropModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
