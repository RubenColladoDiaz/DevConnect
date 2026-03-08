import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  cpCreditsUrl: string = "https://codepen.io/PickJBennett/details/BdbrMW";
  cpCreditsTitle: string = "🌈 Sexy Animated Rainbow Waves Header";
  tweetUrl: string = "";
  tweetText: string = "Tweet This Pen";

  ngOnInit(): void {
    this.tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(this.cpCreditsTitle)}&url=${encodeURIComponent(this.cpCreditsUrl)}&via=PickJBennett&related=PickJBennett,CiaoFileManager`;
  }
}
