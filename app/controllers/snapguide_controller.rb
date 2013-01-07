require 'net/http'
class SnapguideController < ApplicationController
    layout false

    def guide
        id = params[:id]
        url = "http://snapguide.com/api/v1/guide/" + id
        uri = URI.parse(url)
        
        http = Net::HTTP.new(uri.host, uri.port)
        res = http.start() do |http|
            req = Net::HTTP::Get.new(uri.request_uri)
            http.request req
        end

        response.headers["Access-Control-Allow-Origins"] = '*'
        
        render :text => res.body.to_s
    end
    
    def index
    end
end
