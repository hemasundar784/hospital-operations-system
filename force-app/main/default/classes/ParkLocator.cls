public class ParkLocator {
    public static List<String> country(String countryName) {
        ParkService.ParksImplPort parkService = new ParkService.ParksImplPort();
        return parkService.byCountry(countryName);
    }
}